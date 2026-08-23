import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminGuard } from '../common/admin.guard';
import { PrismaService } from '../common/prisma.service';
import { BlockInstancesController } from './block-instances.controller';
import { EditorService } from './editor.service';
import { PagesController } from './pages.controller';
import { UpgradesController } from './upgrades.controller';
import { UpgradesService } from './upgrades.service';

@Module({
  imports: [AuthModule],
  controllers: [PagesController, BlockInstancesController, UpgradesController],
  providers: [EditorService, UpgradesService, PrismaService, AdminGuard],
  exports: [EditorService],
})
export class EditorModule {}
