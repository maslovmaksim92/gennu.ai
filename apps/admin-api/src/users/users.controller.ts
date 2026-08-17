import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { AdminGuard } from '../common/admin.guard';
import { PrismaService } from '../common/prisma.service';
@Controller('users')
@UseGuards(JwtGuard, AdminGuard)
export class UsersController {
  constructor(private prisma: PrismaService) {
  }
  @Get()
  list() {
    return this.prisma.user.findMany({
      select: {
        id: true, email: true, role: true, status: true, emailVerified: true, lastLoginAt: true, createdAt: true
      }, orderBy: {
        createdAt: 'desc'
      }
    });
  }
  @Patch(':id/status')
  status(
  @Param('id')
  id: string, 
  @Body()
  body: {
    status: 'ACTIVE' | 'BLOCKED';
  }) {
    return this.prisma.user.update({
      where: {
        id
      }, data: {
        status: body.status
      }, select: {
        id: true, email: true, status: true
      }
    });
  }
}
