import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { AdminGuard } from '../common/admin.guard';
import { PrismaService } from '../common/prisma.service';
@Controller('themes')
@UseGuards(JwtGuard, AdminGuard)
export class ThemesController {
  constructor(private prisma: PrismaService) {
  }
  @Get()
  list() {
    return this.prisma.theme.findMany({
      orderBy: {
        updatedAt: 'desc'
      }
    });
  }
  @Post()
  create(
  @Req()
  req: any, 
  @Body()
  body: any) {
    return this.prisma.theme.create({
      data: {
        key: body.key, name: body.name, description: body.description, schema: body.schema ?? {}, createdById: req.user.sub
      }
    });
  }
  @Patch(':id')
  update(
  @Param('id')
  id: string, 
  @Body()
  body: any) {
    return this.prisma.theme.update({
      where: {
        id
      }, data: {
        name: body.name, description: body.description, schema: body.schema, status: body.status
      }
    });
  }
  @Delete(':id')
  delete(
  @Param('id')
  id: string) {
    return this.prisma.theme.delete({
      where: {
        id
      }
    });
  }
}
