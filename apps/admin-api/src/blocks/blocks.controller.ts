import {
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PublishStatus } from '@prisma/client';
import { JwtGuard } from '../auth/jwt.guard';
import { AdminGuard } from '../common/admin.guard';
import { PrismaService } from '../common/prisma.service';
import { assertCanPublish, assertDraft, parseSemanticVersion } from '../common/versioning';

@Controller('blocks')
@UseGuards(JwtGuard, AdminGuard)
export class BlocksController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list() {
    const blocks = await this.prisma.blockDefinition.findMany({
      include: {
        versions: {
          orderBy: [{ major: 'desc' }, { minor: 'desc' }, { patch: 'desc' }],
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return blocks.map(({ versions, ...block }) => ({
      ...block,
      versionId: versions[0]?.id ?? null,
      version: versions[0]?.version ?? null,
      status: versions[0]?.status ?? null,
      schema: versions[0]?.schema ?? {},
      defaults: versions[0]?.defaults ?? {},
    }));
  }

  @Get(':id/versions')
  versions(@Param('id') id: string) {
    return this.prisma.blockVersion.findMany({
      where: { blockDefinitionId: id },
      orderBy: [{ major: 'desc' }, { minor: 'desc' }, { patch: 'desc' }],
    });
  }

  @Post()
  create(@Req() req: any, @Body() body: any) {
    return this.prisma.blockDefinition.create({
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
            defaults: body.defaults ?? {},
            changelog: body.changelog,
          },
        },
      },
      include: { versions: true },
    });
  }

  @Patch(':id')
  updateDefinition(@Param('id') id: string, @Body() body: any) {
    return this.prisma.blockDefinition.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
      },
    });
  }

  @Post(':id/versions')
  async createVersion(@Param('id') id: string, @Body() body: any) {
    const version = parseSemanticVersion(body.version);
    const block = await this.prisma.blockDefinition.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: [{ major: 'desc' }, { minor: 'desc' }, { patch: 'desc' }],
          take: 1,
        },
      },
    });

    if (!block) {
      throw new NotFoundException('Block not found.');
    }

    const source = block.versions[0];
    return this.prisma.blockVersion.create({
      data: {
        blockDefinitionId: id,
        version: body.version,
        ...version,
        schema: body.schema ?? source?.schema ?? {},
        defaults: body.defaults ?? source?.defaults ?? {},
        changelog: body.changelog,
        migration: body.migration,
      },
    });
  }

  @Patch('versions/:versionId')
  async updateDraftVersion(@Param('versionId') versionId: string, @Body() body: any) {
    const version = await this.prisma.blockVersion.findUnique({ where: { id: versionId } });
    if (!version) {
      throw new NotFoundException('Block version not found.');
    }
    assertDraft(version.status);

    return this.prisma.blockVersion.update({
      where: { id: versionId },
      data: {
        schema: body.schema,
        defaults: body.defaults,
        changelog: body.changelog,
        migration: body.migration,
      },
    });
  }

  @Post('versions/:versionId/publish')
  async publishVersion(@Param('versionId') versionId: string) {
    const version = await this.prisma.blockVersion.findUnique({ where: { id: versionId } });
    if (!version) {
      throw new NotFoundException('Block version not found.');
    }
    assertCanPublish(version.status);

    return this.prisma.blockVersion.update({
      where: { id: versionId },
      data: {
        status: PublishStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });
  }

  @Post('versions/:versionId/deprecate')
  async deprecateVersion(@Param('versionId') versionId: string) {
    const version = await this.prisma.blockVersion.findUnique({ where: { id: versionId } });
    if (!version) {
      throw new NotFoundException('Block version not found.');
    }
    if (version.status !== PublishStatus.PUBLISHED) {
      throw new ConflictException('Only published versions can be deprecated.');
    }

    return this.prisma.blockVersion.update({
      where: { id: versionId },
      data: { status: PublishStatus.DEPRECATED },
    });
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    const block = await this.prisma.blockDefinition.findUnique({
      where: { id },
      include: { versions: { select: { status: true } } },
    });
    if (!block) {
      throw new NotFoundException('Block not found.');
    }
    if (block.versions.some((version) => version.status !== PublishStatus.DRAFT)) {
      throw new ConflictException('A block with published history cannot be deleted; deprecate it instead.');
    }

    return this.prisma.blockDefinition.delete({ where: { id } });
  }
}
