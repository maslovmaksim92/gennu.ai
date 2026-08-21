import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { AuthModule } from '../auth/auth.module';
import { AdminGuard } from '../common/admin.guard';
import { PrismaService } from '../common/prisma.service';
import { SiteGeneratorController } from './site-generator.controller';
import { SiteGeneratorService } from './site-generator.service';

@Module({
  imports: [AuthModule, AiModule],
  controllers: [SiteGeneratorController],
  providers: [SiteGeneratorService, PrismaService, AdminGuard],
})
export class SiteGeneratorModule {}
