import { Module } from '@nestjs/common'; import { AuthModule } from '../auth/auth.module'; import { PrismaService } from '../common/prisma.service'; import { AdminGuard } from '../common/admin.guard'; import { ThemesController } from './themes.controller';
@Module({imports:[AuthModule],controllers:[ThemesController],providers:[PrismaService,AdminGuard]}) export class ThemesModule{}
