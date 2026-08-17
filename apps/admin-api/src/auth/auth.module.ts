import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../common/prisma.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtGuard } from './jwt.guard';

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, JwtGuard, PrismaService],
  exports: [JwtGuard, JwtModule],
})
export class AuthModule {}
