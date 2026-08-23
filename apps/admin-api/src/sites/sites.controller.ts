import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PublishStatus } from '@prisma/client';
import { JwtGuard } from '../auth/jwt.guard';
import { AdminGuard } from '../common/admin.guard';
import { PrismaService } from '../common/prisma.service';
import { EditorService } from '../editor/editor.service';

@Controller('sites')
@UseGuards(JwtGuard, AdminGuard)
export class SitesController {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly editor: EditorService,
  ) {}

  @Get()
  public async list() {
    const sites = await this.prisma.site.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        themeVersion: { include: { theme: true } },
        templateVersion: { include: { template: true } },
        _count: { select: { pages: true } },
      },
    });

    return sites.map((site) => ({
      id: site.id,
      name: site.name,
      pageCount: site._count.pages,
      themeName: site.themeVersion?.theme.name ?? null,
      themeVersion: site.themeVersion?.version ?? null,
      templateName: site.templateVersion?.template.name ?? null,
      templateVersion: site.templateVersion?.version ?? null,
      updatedAt: site.updatedAt,
    }));
  }

  /** The block versions the site's template approved, for the editor's palette. */
  @Get(':id/palette')
  public palette(@Param('id') id: string) {
    return this.editor.palette(id);
  }

  /**
   * Renames a site or repins its theme.
   *
   * Repinning is an explicit, user-driven act — exactly the upgrade path
   * docs/versioning.md describes. Nothing here ever changes a pinned version
   * on its own.
   */
  @Patch(':id')
  public async update(@Param('id') id: string, @Body() body: any) {
    const site = await this.prisma.site.findUnique({ where: { id } });

    if (!site) {
      throw new NotFoundException('Site not found.');
    }

    if (body.themeVersionId) {
      const theme = await this.prisma.themeVersion.findUnique({
        where: { id: body.themeVersionId },
      });

      if (!theme) {
        throw new NotFoundException('Theme version not found.');
      }

      if (theme.status === PublishStatus.DEPRECATED) {
        throw new BadRequestException('Deprecated theme versions cannot be pinned.');
      }
    }

    return this.prisma.site.update({
      where: { id },
      data: {
        name: typeof body.name === 'string' ? body.name.trim() : undefined,
        themeVersionId: body.themeVersionId === undefined ? undefined : body.themeVersionId,
      },
    });
  }

  @Post(':id/pages')
  public async addPage(@Param('id') id: string, @Body() body: any) {
    const site = await this.prisma.site.findUnique({ where: { id } });

    if (!site) {
      throw new NotFoundException('Site not found.');
    }

    const slug = await this.editor.assertUsableSlug(id, body.slug ?? '');
    const name = typeof body.name === 'string' ? body.name.trim() : '';

    if (!name) {
      throw new BadRequestException('A page needs a name.');
    }

    return this.prisma.page.create({ data: { siteId: id, name, slug } });
  }

  @Get(':id')
  public async get(@Param('id') id: string) {
    const site = await this.prisma.site.findUnique({
      where: { id },
      include: {
        themeVersion: { include: { theme: true } },
        templateVersion: { include: { template: true } },
        pages: {
          orderBy: { createdAt: 'asc' },
          include: {
            blocks: {
              orderBy: { sortOrder: 'asc' },
              include: { blockVersion: { include: { blockDefinition: true } } },
            },
          },
        },
      },
    });

    if (!site) {
      throw new NotFoundException('Site not found.');
    }

    return site;
  }
}
