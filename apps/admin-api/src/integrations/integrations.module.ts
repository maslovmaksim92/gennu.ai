import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaService } from '../common/prisma.service';
import { AdminGuard } from '../common/admin.guard';
import { IntegrationsController } from './integrations.controller';
import { CryptoService } from './crypto.service';
@Module({
  imports: [AuthModule],
  controllers: [IntegrationsController],
  providers: [PrismaService, CryptoService, AdminGuard],
  exports: [CryptoService],
})
export class IntegrationsModule {}
