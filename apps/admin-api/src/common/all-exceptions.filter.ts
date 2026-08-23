import { randomUUID } from 'crypto';
import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  Logger,
  type ExceptionFilter,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';

/**
 * Turns anything thrown into a response that says as much as it safely can.
 *
 * Nest's default handler answers an unexpected throw with a bare 500 and no
 * correlation, so an operator reading a support report has nothing to search
 * the logs for. Every failure here gets an id that appears in both the log line
 * and the response body. Deliberate `HttpException`s keep their own message —
 * they were written for the user — while everything else is logged in full and
 * reported as a generic failure, because a raw Prisma error names columns and
 * constraints that a client has no business seeing.
 */
/** What a caller is told for each failure we chose to translate. */
const MESSAGES: Partial<Record<number, string>> = {
  [HttpStatus.CONFLICT]: 'That value is already taken.',
  [HttpStatus.NOT_FOUND]: 'Not found.',
  [HttpStatus.BAD_REQUEST]: 'The request could not be processed.',
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Http');

  public catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const request = http.getRequest<Request>();
    const reference = randomUUID();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();

      if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
        this.logger.error(`${reference} ${request.method} ${request.url}`, exception.stack);
      }

      response
        .status(status)
        .json(typeof body === 'string' ? { statusCode: status, message: body, reference } : body);
      return;
    }

    const status = this.statusFor(exception);

    this.logger.error(
      `${reference} ${request.method} ${request.url} -> ${status}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    response.status(status).json({
      statusCode: status,
      message: MESSAGES[status] ?? 'Unexpected server error.',
      reference,
    });
  }

  /**
   * The few Prisma failures that are really the caller's fault.
   *
   * Everything else stays a 500: guessing at intent from an error code hides
   * real bugs behind friendly 4xx responses.
   */
  private statusFor(exception: unknown): HttpStatus {
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        return HttpStatus.CONFLICT;
      }

      if (exception.code === 'P2025') {
        return HttpStatus.NOT_FOUND;
      }
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      return HttpStatus.BAD_REQUEST;
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }
}
