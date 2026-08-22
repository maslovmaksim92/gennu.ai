import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminGuard } from '../common/admin.guard';
import { PrismaService } from '../common/prisma.service';
import { PreviewTokenService } from './preview-token.service';
import { RenderController } from './render.controller';
import { RenderService } from './render.service';

@Module({
  imports: [AuthModule],
  controllers: [RenderController],
  providers: [RenderService, PreviewTokenService, PrismaService, AdminGuard],
  exports: [RenderService],
})
export class RenderModule {}
