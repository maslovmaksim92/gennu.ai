import { Module } from '@nestjs/common';
import { AdminsModule } from '../admins/admins.module';
import { AiModule } from '../ai/ai.module';
import { AuthModule } from '../auth/auth.module';
import { BlocksModule } from '../blocks/blocks.module';
import { AuditService } from '../common/audit.service';
import { PrismaService } from '../common/prisma.service';
import { EditorModule } from '../editor/editor.module';
import { HealthController } from '../health/health.controller';
import { IntegrationsModule } from '../integrations/integrations.module';
import { RenderModule } from '../render/render.module';
import { SiteGeneratorModule } from '../site-generator/site-generator.module';
import { SitesModule } from '../sites/sites.module';
import { TemplatesModule } from '../templates/templates.module';
import { ThemesModule } from '../themes/themes.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    AuthModule,
    AdminsModule,
    UsersModule,
    ThemesModule,
    BlocksModule,
    TemplatesModule,
    IntegrationsModule,
    AiModule,
    SiteGeneratorModule,
    SitesModule,
    EditorModule,
    RenderModule,
  ],
  controllers: [HealthController],
  providers: [PrismaService, AuditService],
  exports: [PrismaService, AuditService],
})
export class AppModule {}
