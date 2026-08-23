import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { AdminGuard } from '../common/admin.guard';
import { PrismaService } from '../common/prisma.service';
import { UpdateUserDto, UpdateUserStatusDto } from './users.dto';

@Controller('users')
@UseGuards(JwtGuard, AdminGuard)
export class UsersController {
  public constructor(private readonly prisma: PrismaService) {}

  @Get()
  public list() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  @Patch(':id')
  public async update(@Param('id') id: string, @Body() body: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === 'ADMIN') {
      throw new BadRequestException('Administrators must be edited from the Administrators table');
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        email: body.email.trim().toLowerCase(),
        status: body.status,
        emailVerified: body.emailVerified,
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });
  }

  /**
   * Blocks or unblocks a non-admin user.
   *
   * The role check is the same one `update()` makes, and it belongs here too:
   * without it this route was a way around the Administrators table, where
   * disabling an admin — including yourself — is deliberately refused.
   */
  @Patch(':id/status')
  public async status(@Param('id') id: string, @Body() body: UpdateUserStatusDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === 'ADMIN') {
      throw new BadRequestException('Administrators must be edited from the Administrators table');
    }

    return this.prisma.user.update({
      where: {
        id,
      },
      data: {
        status: body.status,
      },
      select: {
        id: true,
        email: true,
        status: true,
      },
    });
  }

  @Delete(':id')
  public async remove(@Param('id') id: string): Promise<{ id: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        role: true,
        _count: {
          select: {
            createdThemes: true,
            createdBlocks: true,
            invitesSent: true,
            auditEntries: true,
            chatSessions: true,
            sites: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === 'ADMIN') {
      throw new BadRequestException('Administrators must be deleted from the Administrators table');
    }

    const hasRelatedData = Object.values(user._count).some((count) => count > 0);
    if (hasRelatedData) {
      throw new BadRequestException('User has related data and cannot be deleted');
    }

    await this.prisma.user.delete({ where: { id } });
    return { id };
  }
}
