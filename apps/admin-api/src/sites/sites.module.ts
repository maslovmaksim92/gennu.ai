import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminGuard } from '../common/admin.guard';
import { PrismaService } from '../common/prisma.service';
import { SitesController } from './sites.controller';

@Module({
  imports: [AuthModule],
  controllers: [SitesController],
  providers: [PrismaService, AdminGuard],
})
export class SitesModule {}
