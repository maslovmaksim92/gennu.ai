import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PublishStatus } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';

interface TemplateSchema {
  allowedBlockVersionIds?: string[];
}

export const PAGE_INCLUDE = {
  blocks: {
    orderBy: { sortOrder: 'asc' as const },
    include: { blockVersion: { include: { blockDefinition: true } } },
  },
};

/**
 * Editing rules for generated sites.
 *
 * The editor may rearrange and refill a site, but it may not widen what the
 * site is allowed to contain: a block can only be added if the site's pinned
 * TemplateVersion already allows that exact BlockVersion. That keeps the
 * versioning invariant intact — a site never gains a block its template did
 * not approve, and an existing page never silently moves to a newer version.
 */
@Injectable()
export class EditorService {
  public constructor(private readonly prisma: PrismaService) {}

  /** Normalises and validates a page slug within one site. */
  public async assertUsableSlug(siteId: string, slug: string, exceptPageId?: string) {
    const trimmed = (slug ?? '').trim();

    if (!trimmed.startsWith('/')) {
      throw new BadRequestException('Slug must start with "/".');
    }

    if (/\s/.test(trimmed)) {
      throw new BadRequestException('Slug cannot contain spaces.');
    }

    const clash = await this.prisma.page.findFirst({
      where: { siteId, slug: trimmed, id: exceptPageId ? { not: exceptPageId } : undefined },
      select: { id: true },
    });

    if (clash) {
      throw new BadRequestException(`Another page already uses the slug ${trimmed}.`);
    }

    return trimmed;
  }

  /** The BlockVersions the site's template approved, newest definitions first. */
  public async palette(siteId: string) {
    const site = await this.prisma.site.findUnique({
      where: { id: siteId },
      include: { templateVersion: true },
    });

    if (!site) {
      throw new NotFoundException('Site not found.');
    }

    const allowed = this.allowedBlockVersionIds(site.templateVersion?.schema);

    if (!allowed.length) {
      return [];
    }

    const versions = await this.prisma.blockVersion.findMany({
      where: { id: { in: allowed }, status: { not: PublishStatus.DEPRECATED } },
      include: { blockDefinition: true },
      orderBy: { createdAt: 'asc' },
    });

    return versions.map((version) => ({
      blockVersionId: version.id,
      key: version.blockDefinition.key,
      name: version.blockDefinition.name,
      description: version.blockDefinition.description,
      version: version.version,
      status: version.status,
      schema: version.schema,
      defaults: version.defaults,
    }));
  }

  /** Throws unless the site's template approved this exact block version. */
  public async assertBlockVersionAllowed(siteId: string, blockVersionId: string) {
    const site = await this.prisma.site.findUnique({
      where: { id: siteId },
      include: { templateVersion: true },
    });

    if (!site) {
      throw new NotFoundException('Site not found.');
    }

    if (!this.allowedBlockVersionIds(site.templateVersion?.schema).includes(blockVersionId)) {
      throw new BadRequestException(
        'This block version is not allowed by the template the site is pinned to.',
      );
    }

    const version = await this.prisma.blockVersion.findUnique({ where: { id: blockVersionId } });

    if (!version) {
      throw new NotFoundException('Block version not found.');
    }

    if (version.status === PublishStatus.DEPRECATED) {
      throw new BadRequestException('Deprecated block versions cannot be added to a page.');
    }

    return version;
  }

  /** Accepts only a JSON object, which is what a block's data and settings are. */
  public asJsonObject(value: unknown, field: string): Prisma.InputJsonValue {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new BadRequestException(`${field} must be a JSON object.`);
    }

    return value as Prisma.InputJsonValue;
  }

  public async pageOrFail(pageId: string) {
    const page = await this.prisma.page.findUnique({
      where: { id: pageId },
      include: PAGE_INCLUDE,
    });

    if (!page) {
      throw new NotFoundException('Page not found.');
    }

    return page;
  }

  private allowedBlockVersionIds(schema: unknown): string[] {
    const parsed = (schema ?? {}) as TemplateSchema;
    return Array.isArray(parsed.allowedBlockVersionIds) ? parsed.allowedBlockVersionIds : [];
  }
}
