import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminGuard } from '../common/admin.guard';
import { PrismaService } from '../common/prisma.service';
import { EditorModule } from '../editor/editor.module';
import { SitesController } from './sites.controller';

@Module({
  imports: [AuthModule, EditorModule],
  controllers: [SitesController],
  providers: [PrismaService, AdminGuard],
})
export class SitesModule {}
