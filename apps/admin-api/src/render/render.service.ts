import { Injectable, NotFoundException } from '@nestjs/common';
import {
  renderPage,
  selectPage,
  type BlockSchema,
  type RenderResult,
  type RenderSiteInput,
  type ThemeSchema,
} from '../../../../libs/engine/render/src';
import { PrismaService } from '../common/prisma.service';

const SITE_INCLUDE = {
  themeVersion: true,
  templateVersion: { include: { template: true } },
  pages: {
    orderBy: { createdAt: 'asc' as const },
    include: {
      blocks: {
        orderBy: { sortOrder: 'asc' as const },
        include: { blockVersion: { include: { blockDefinition: true } } },
      },
    },
  },
};

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

@Injectable()
export class RenderService {
  public constructor(private readonly prisma: PrismaService) {}

  /**
   * Builds the render model of a site.
   *
   * Every block renders from the exact `BlockVersion` it was pinned to, so a
   * newer published version never changes an existing site.
   */
  public async model(siteId: string): Promise<RenderSiteInput> {
    const site = await this.prisma.site.findUnique({
      where: { id: siteId },
      include: SITE_INCLUDE,
    });

    if (!site) {
      throw new NotFoundException('Site not found.');
    }

    return {
      name: site.name,
      theme: site.themeVersion ? (asRecord(site.themeVersion.schema) as ThemeSchema) : undefined,
      pages: site.pages.map((page) => ({
        name: page.name,
        slug: page.slug,
        blocks: page.blocks.map((instance) => ({
          id: instance.id,
          key: instance.blockVersion.blockDefinition.key,
          schema: asRecord(instance.blockVersion.schema) as BlockSchema,
          defaults: asRecord(instance.blockVersion.defaults),
          data: asRecord(instance.data),
          settings: asRecord(instance.settings),
        })),
      })),
    };
  }

  /** Renders one page of a site to a complete HTML document. */
  public async html(
    siteId: string,
    slug: string | undefined,
    options: { basePath?: string; pageParam?: string; noIndex?: boolean } = {},
  ): Promise<RenderResult> {
    const site = await this.model(siteId);
    const page = selectPage(site, slug);

    if (!page) {
      throw new NotFoundException('Site has no pages to render.');
    }

    return renderPage(site, page, options);
  }
}
