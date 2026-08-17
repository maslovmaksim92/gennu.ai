import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaService } from '../common/prisma.service';
import { AdminGuard } from '../common/admin.guard';
import { BlocksController } from './blocks.controller';
@Module({
  imports: [
    AuthModule
  ], controllers: [
    BlocksController
  ], providers: [
    PrismaService, AdminGuard
  ]
})
export class BlocksModule {
}
