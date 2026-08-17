import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaService } from '../common/prisma.service'; import { AdminGuard } from '../common/admin.guard';
import { AuditService } from '../common/audit.service';
import { AdminsController } from './admins.controller';
import { AdminsService } from './admins.service';
@Module({ imports:[AuthModule], controllers:[AdminsController], providers:[AdminsService, PrismaService, AuditService, AdminGuard] })
export class AdminsModule {}
