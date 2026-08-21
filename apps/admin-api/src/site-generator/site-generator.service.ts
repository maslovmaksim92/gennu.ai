import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PublishStatus } from '@prisma/client';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../common/prisma.service';

interface TemplateSchema {
  allowedBlockVersionIds?: string[];
  defaultThemeVersionId?: string;
}

interface GeneratedBlock {
  blockVersionId: string;
  data: Record<string, unknown>;
  settings?: Record<string, unknown>;
}

interface GeneratedPage {
  name: string;
  slug: string;
  blocks: GeneratedBlock[];
}

interface GeneratedSiteDraft {
  name: string;
  pages: GeneratedPage[];
}

@Injectable()
export class SiteGeneratorService {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
  ) {}

  public async generate(ownerId: string, templateVersionId: string, prompt: string) {
    const templateVersion = await this.prisma.templateVersion.findUnique({
      where: { id: templateVersionId },
      include: { template: true },
    });

    if (!templateVersion) {
      throw new NotFoundException('Template version not found.');
    }

    if (templateVersion.status === PublishStatus.DEPRECATED) {
      throw new BadRequestException('Deprecated templates cannot be used for generation.');
    }

    const templateSchema = (templateVersion.schema ?? {}) as TemplateSchema;
    const allowedBlockVersionIds = [...new Set(templateSchema.allowedBlockVersionIds ?? [])];

    if (!allowedBlockVersionIds.length) {
      throw new BadRequestException('Template does not define allowed block versions.');
    }

    const blockVersions = await this.prisma.blockVersion.findMany({
      where: {
        id: { in: allowedBlockVersionIds },
        status: { not: PublishStatus.DEPRECATED },
      },
      include: { blockDefinition: true },
    });

    if (blockVersions.length !== allowedBlockVersionIds.length) {
      throw new BadRequestException('Template references missing or deprecated block versions.');
    }

    const catalog = blockVersions.map((version) => ({
      id: version.id,
      key: version.blockDefinition.key,
      name: version.blockDefinition.name,
      version: version.version,
      schema: version.schema,
      defaults: version.defaults,
    }));

    const generated = await this.ai.generateJson<GeneratedSiteDraft>(
      [
        'You generate structured website drafts for Proto.ai.',
        'Never output HTML, CSS, JavaScript or framework code.',
        'Use only the blockVersionId values provided in the block catalog.',
        'Return one JSON object with: name and pages[].',
        'Each page must contain name, slug and blocks[].',
        'Each block must contain blockVersionId, data and optional settings.',
        'All page slugs must start with /.',
      ].join(' '),
      JSON.stringify({
        request: prompt,
        template: {
          id: templateVersion.template.id,
          key: templateVersion.template.key,
          name: templateVersion.template.name,
          version: templateVersion.version,
          schema: templateVersion.schema,
        },
        blocks: catalog,
      }),
    );

    this.validateDraft(generated.data, allowedBlockVersionIds);

    const themeVersionId = templateSchema.defaultThemeVersionId?.trim() || null;

    if (themeVersionId) {
      const theme = await this.prisma.themeVersion.findUnique({ where: { id: themeVersionId } });
      if (!theme || theme.status === PublishStatus.DEPRECATED) {
        throw new BadRequestException('Template references an invalid default theme version.');
      }
    }

    const site = await this.prisma.site.create({
      data: {
        ownerId,
        name: generated.data.name.trim(),
        templateVersionId: templateVersion.id,
        themeVersionId,
        pages: {
          create: generated.data.pages.map((page) => ({
            name: page.name.trim(),
            slug: page.slug.trim(),
            blocks: {
              create: page.blocks.map((block, index) => ({
                blockVersionId: block.blockVersionId,
                data: block.data,
                settings: block.settings ?? {},
                sortOrder: index,
              })),
            },
          })),
        },
      },
      include: {
        templateVersion: { include: { template: true } },
        themeVersion: { include: { theme: true } },
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

    return {
      site,
      generation: {
        model: generated.model,
        responseId: generated.responseId,
        templateVersionId: templateVersion.id,
      },
    };
  }

  private validateDraft(draft: GeneratedSiteDraft, allowedBlockVersionIds: string[]): void {
    if (!draft || typeof draft.name !== 'string' || !draft.name.trim()) {
      throw new BadRequestException('AI returned a site without a valid name.');
    }

    if (!Array.isArray(draft.pages) || !draft.pages.length) {
      throw new BadRequestException('AI returned a site without pages.');
    }

    const allowed = new Set(allowedBlockVersionIds);
    const slugs = new Set<string>();

    for (const page of draft.pages) {
      if (!page || typeof page.name !== 'string' || typeof page.slug !== 'string') {
        throw new BadRequestException('AI returned an invalid page.');
      }

      if (!page.slug.startsWith('/')) {
        throw new BadRequestException(`Invalid page slug: ${page.slug}`);
      }

      if (slugs.has(page.slug)) {
        throw new BadRequestException(`Duplicate page slug: ${page.slug}`);
      }
      slugs.add(page.slug);

      if (!Array.isArray(page.blocks)) {
        throw new BadRequestException(`Page ${page.slug} has an invalid blocks list.`);
      }

      for (const block of page.blocks) {
        if (!allowed.has(block.blockVersionId)) {
          throw new BadRequestException(
            `AI selected block version ${block.blockVersionId} that is not allowed by the template.`,
          );
        }

        if (!block.data || typeof block.data !== 'object' || Array.isArray(block.data)) {
          throw new BadRequestException('AI returned invalid block data.');
        }
      }
    }
  }
}
