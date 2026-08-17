import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { AdminGuard } from '../common/admin.guard';
import { PrismaService } from '../common/prisma.service';
@Controller('blocks')
@UseGuards(JwtGuard, AdminGuard)
export class BlocksController {
  constructor(private prisma: PrismaService) {
  }
  @Get()
  list() {
    return this.prisma.blockDefinition.findMany({
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
    return this.prisma.blockDefinition.create({
      data: {
        key: body.key, name: body.name, description: body.description, schema: body.schema ?? {}, defaults: body.defaults ?? {}, createdById: req.user.sub
      }
    });
  }
  @Patch(':id')
  update(
  @Param('id')
  id: string, 
  @Body()
  body: any) {
    return this.prisma.blockDefinition.update({
      where: {
        id
      }, data: {
        name: body.name, description: body.description, schema: body.schema, defaults: body.defaults, status: body.status
      }
    });
  }
  @Delete(':id')
  delete(
  @Param('id')
  id: string) {
    return this.prisma.blockDefinition.delete({
      where: {
        id
      }
    });
  }
}
