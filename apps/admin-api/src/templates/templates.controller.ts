import {
  BadRequestException,
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
import { Prisma, PublishStatus } from '@prisma/client';
import { JwtGuard } from '../auth/jwt.guard';
import { AdminGuard } from '../common/admin.guard';
import { PrismaService } from '../common/prisma.service';
import { assertCanPublish, assertDraft, parseSemanticVersion } from '../common/versioning';

interface TemplateSchema {
  allowedBlockVersionIds?: unknown;
}

/**
 * Templates decide which exact BlockVersions a site may contain.
 *
 * That makes `schema.allowedBlockVersionIds` the gate the editor enforces at
 * runtime, so it is validated here rather than trusted: every id must exist
 * and must not be deprecated before a template version can be published.
 */
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

  @Get(':id/versions')
  public versions(@Param('id') id: string) {
    return this.prisma.templateVersion.findMany({
      where: { templateId: id },
      orderBy: [{ major: 'desc' }, { minor: 'desc' }, { patch: 'desc' }],
    });
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

  @Patch(':id')
  public updateDefinition(@Param('id') id: string, @Body() body: any) {
    return this.prisma.template.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
      },
    });
  }

  @Post(':id/versions')
  public async createVersion(@Param('id') id: string, @Body() body: any) {
    const version = parseSemanticVersion(body.version);
    const template = await this.prisma.template.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: [{ major: 'desc' }, { minor: 'desc' }, { patch: 'desc' }],
          take: 1,
        },
      },
    });

    if (!template) {
      throw new NotFoundException('Template not found.');
    }

    const source = template.versions[0];
    return this.prisma.templateVersion.create({
      data: {
        templateId: id,
        version: body.version,
        ...version,
        schema: (body.schema ?? source?.schema ?? {}) as Prisma.InputJsonValue,
        changelog: body.changelog,
      },
    });
  }

  @Patch('versions/:versionId')
  public async updateDraftVersion(@Param('versionId') versionId: string, @Body() body: any) {
    const version = await this.prisma.templateVersion.findUnique({ where: { id: versionId } });

    if (!version) {
      throw new NotFoundException('Template version not found.');
    }

    assertDraft(version.status);

    if (body.schema !== undefined) {
      await this.assertAllowedBlocksResolve(body.schema);
    }

    return this.prisma.templateVersion.update({
      where: { id: versionId },
      data: {
        schema: body.schema as Prisma.InputJsonValue,
        changelog: body.changelog,
      },
    });
  }

  /** Sites pinned to this template version — what a deprecation would strand. */
  @Get('versions/:versionId/usage')
  public async usage(@Param('versionId') versionId: string) {
    const sites = await this.prisma.site.findMany({
      where: { templateVersionId: versionId },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    return { siteCount: sites.length, sites };
  }

  @Post('versions/:versionId/publish')
  public async publish(@Param('versionId') versionId: string) {
    const version = await this.prisma.templateVersion.findUnique({ where: { id: versionId } });

    if (!version) {
      throw new NotFoundException('Template version not found.');
    }

    assertCanPublish(version.status);
    await this.assertAllowedBlocksResolve(version.schema);

    return this.prisma.templateVersion.update({
      where: { id: versionId },
      data: {
        status: PublishStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });
  }

  @Post('versions/:versionId/deprecate')
  public async deprecate(@Param('versionId') versionId: string) {
    const version = await this.prisma.templateVersion.findUnique({ where: { id: versionId } });

    if (!version) {
      throw new NotFoundException('Template version not found.');
    }

    if (version.status !== PublishStatus.PUBLISHED) {
      throw new ConflictException('Only published versions can be deprecated.');
    }

    return this.prisma.templateVersion.update({
      where: { id: versionId },
      data: { status: PublishStatus.DEPRECATED },
    });
  }

  @Delete(':id')
  public async delete(@Param('id') id: string) {
    const template = await this.prisma.template.findUnique({
      where: { id },
      include: { versions: { select: { status: true } } },
    });

    if (!template) {
      throw new NotFoundException('Template not found.');
    }

    if (template.versions.some((version) => version.status !== PublishStatus.DRAFT)) {
      throw new ConflictException(
        'A template with published history cannot be deleted; deprecate it instead.',
      );
    }

    return this.prisma.template.delete({ where: { id } });
  }

  /**
   * Every allowed block version must exist and must not be deprecated.
   *
   * Without this check a template could approve a block version that no longer
   * renders, and the failure would only surface later in a site editor.
   */
  private async assertAllowedBlocksResolve(schema: unknown): Promise<void> {
    if (typeof schema !== 'object' || schema === null || Array.isArray(schema)) {
      throw new BadRequestException('Template schema must be a JSON object.');
    }

    const raw = (schema as TemplateSchema).allowedBlockVersionIds;

    if (raw === undefined) {
      return;
    }

    if (!Array.isArray(raw) || raw.some((id) => typeof id !== 'string')) {
      throw new BadRequestException('allowedBlockVersionIds must be an array of strings.');
    }

    const ids = raw as string[];

    if (!ids.length) {
      return;
    }

    const found = await this.prisma.blockVersion.findMany({
      where: { id: { in: ids } },
      select: { id: true, status: true, version: true, blockDefinition: { select: { key: true } } },
    });

    const missing = ids.filter((id) => !found.some((version) => version.id === id));

    if (missing.length) {
      throw new BadRequestException(`Unknown block versions: ${missing.join(', ')}.`);
    }

    const deprecated = found.filter((version) => version.status === PublishStatus.DEPRECATED);

    if (deprecated.length) {
      const labels = deprecated
        .map((version) => `${version.blockDefinition.key}@${version.version}`)
        .join(', ');
      throw new BadRequestException(`Deprecated block versions cannot be allowed: ${labels}.`);
    }
  }
}
