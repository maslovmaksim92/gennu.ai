import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaService } from '../common/prisma.service';
import { AdminGuard } from '../common/admin.guard';
import { CryptoService } from '../integrations/crypto.service';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
@Module({
  imports: [AuthModule],
  controllers: [AiController],
  providers: [AiService, PrismaService, CryptoService, AdminGuard],
})
export class AiModule {}
