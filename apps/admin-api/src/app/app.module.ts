import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
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
    /**
     * A generous ceiling for authenticated admin work, so ordinary editing is
     * never throttled. The routes that actually need protecting — anything that
     * accepts a password or an invite token — narrow it with their own
     * `@Throttle`, because those are the ones worth guessing at.
     */
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 300 }]),
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
  providers: [PrismaService, AuditService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
  exports: [PrismaService, AuditService],
})
export class AppModule {}
