import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminGuard } from '../common/admin.guard';
import { PrismaService } from '../common/prisma.service';
import { TemplatesController } from './templates.controller';

@Module({
  imports: [AuthModule],
  controllers: [TemplatesController],
  providers: [PrismaService, AdminGuard],
})
export class TemplatesModule {}
