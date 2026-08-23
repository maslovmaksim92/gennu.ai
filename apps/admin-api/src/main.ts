import 'reflect-metadata';
import { existsSync } from 'fs';
import { join } from 'path';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app/app.module';
import { AllExceptionsFilter } from './common/all-exceptions.filter';
import { assertEnvironment } from './common/environment';

async function bootstrap() {
  assertEnvironment();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());

  /**
   * Behind a proxy the client address arrives in `X-Forwarded-For`; without
   * this the rate limiter would see a single address for every request and
   * throttle every caller as one.
   */
  app.set('trust proxy', 1);

  app.enableCors({
    origin: process.env.ADMIN_WEB_URL ?? 'http://localhost:4200',
  });

  if (process.env.NODE_ENV === 'production') {
    const staticRoot =
      process.env.ADMIN_STATIC_ROOT ?? join(process.cwd(), 'dist/apps/admin/browser');
    if (existsSync(staticRoot)) {
      app.useStaticAssets(staticRoot);
      const express = app.getHttpAdapter().getInstance();
      express.get('/*path', (req: any, res: any, next: any) => {
        if (req.path.startsWith('/api')) return next();
        return res.sendFile(join(staticRoot, 'index.html'));
      });
    }
  }

  await app.listen(Number(process.env.ADMIN_PORT ?? 3001), '0.0.0.0');
}

bootstrap().catch((error: unknown) => {
  /**
   * A failed bootstrap used to surface as an unhandled rejection from a process
   * that stayed alive without serving anything. Report the reason and exit
   * non-zero so a supervisor, a compose healthcheck or CI notices.
   */
  new Logger('Bootstrap').error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
