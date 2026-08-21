import {
  Body,
  ConflictException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PublishStatus } from '@prisma/client';
import { JwtGuard } from '../auth/jwt.guard';
import { AdminGuard } from '../common/admin.guard';
import { PrismaService } from '../common/prisma.service';

@Controller('templates')
@UseGuards(JwtGuard, AdminGuard)
export class TemplatesController {
  public constructor(private readonly prisma: PrismaService) {}

  @Get()
  public async list() {
    const templates = await this.prisma.template.findMany({
      include: {
        versions: {
          orderBy: [{ major: 'desc' }, { minor: 'desc' }, { patch: 'desc' }],
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return templates.map(({ versions, ...template }) => ({
      ...template,
      versionId: versions[0]?.id ?? null,
      version: versions[0]?.version ?? null,
      status: versions[0]?.status ?? null,
      schema: versions[0]?.schema ?? {},
    }));
  }

  @Post()
  public create(@Req() req: any, @Body() body: any) {
    return this.prisma.template.create({
      data: {
        key: body.key,
        name: body.name,
        description: body.description,
        createdById: req.user.sub,
        versions: {
          create: {
            version: '1.0.0',
            major: 1,
            minor: 0,
            patch: 0,
            schema: body.schema ?? {},
          },
        },
      },
      include: { versions: true },
    });
  }

  @Post('versions/:versionId/publish')
  public async publish(@Param('versionId') versionId: string) {
    const version = await this.prisma.templateVersion.findUnique({ where: { id: versionId } });

    if (!version) {
      throw new NotFoundException('Template version not found.');
    }

    if (version.status !== PublishStatus.DRAFT) {
      throw new ConflictException('Only draft template versions can be published.');
    }

    return this.prisma.templateVersion.update({
      where: { id: versionId },
      data: {
        status: PublishStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });
  }
}
