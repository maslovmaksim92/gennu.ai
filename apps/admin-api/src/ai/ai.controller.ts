import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import { JwtGuard } from '../auth/jwt.guard';
import { AdminGuard } from '../common/admin.guard';
import { AiService } from './ai.service';
class ChatDto {
  @IsString()
  message!: string;
  @IsOptional()
  @IsString()
  sessionId?: string;
}
@Controller('ai')
@UseGuards(JwtGuard, AdminGuard)
export class AiController {
  constructor(private ai: AiService) {}
  @Post('chat')
  chat(
    @Req()
    req: any,
    @Body()
    dto: ChatDto,
  ) {
    return this.ai.chat(req.user.sub, dto.message, dto.sessionId);
  }
}
