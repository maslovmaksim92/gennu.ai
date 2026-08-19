import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminsModule } from '../admins/admins.module';
import { UsersModule } from '../users/users.module';
import { ThemesModule } from '../themes/themes.module';
import { BlocksModule } from '../blocks/blocks.module';
import { IntegrationsModule } from '../integrations/integrations.module';
import { AiModule } from '../ai/ai.module';
import { HealthController } from '../health/health.controller';
import { PrismaService } from '../common/prisma.service';
import { AuditService } from '../common/audit.service';

@Module({
  imports: [
    AuthModule,
    AdminsModule,
    UsersModule,
    ThemesModule,
    BlocksModule,
    IntegrationsModule,
    AiModule,
  ],
  controllers: [HealthController],
  providers: [PrismaService, AuditService],
  exports: [PrismaService, AuditService],
})
export class AppModule {}
