import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaService } from '../common/prisma.service';
import { AdminGuard } from '../common/admin.guard';
import { UsersController } from './users.controller';
@Module({
  imports: [AuthModule],
  controllers: [UsersController],
  providers: [PrismaService, AdminGuard],
})
export class UsersModule {}
