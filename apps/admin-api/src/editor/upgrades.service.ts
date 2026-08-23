import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PublishStatus } from '@prisma/client';
import type { BlockField, BlockSchema } from '@atlas/render';
import { PrismaService } from '../common/prisma.service';

const VERSION_ORDER = [
  { major: 'desc' as const },
  { minor: 'desc' as const },
  { patch: 'desc' as const },
];

interface TemplateSchema {
  allowedBlockVersionIds?: string[];
}

export interface FieldChange {
  key: string;
  type: string;
  label: string | null;
  required: boolean;
}

/**
 * Moving a site from one pinned version to another.
 *
 * Nothing here happens on its own: a site keeps the exact ThemeVersion and
 * BlockVersions it was pinned to until an operator asks for a move, and every
 * move is checked against the template that governs the site. The upgrade path
 * is therefore always the same chain — allow the new block version in a
 * template version, repin the site's template, then repin the blocks.
 */
@Injectable()
export class UpgradesService {
  public constructor(private readonly prisma: PrismaService) {}

  /** Everything the admin needs to offer upgrades for one site. */
  public async overview(siteId: string) {
    const site = await this.prisma.site.findUnique({
      where: { id: siteId },
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

    const allowed = this.allowedBlockVersionIds(site.templateVersion?.schema);

    const theme = site.themeVersion
      ? {
          themeId: site.themeVersion.themeId,
          themeName: site.themeVersion.theme.name,
          currentVersionId: site.themeVersion.id,
          currentVersion: site.themeVersion.version,
          currentStatus: site.themeVersion.status,
          available: (
            await this.prisma.themeVersion.findMany({
              where: {
                themeId: site.themeVersion.themeId,
                status: { not: PublishStatus.DEPRECATED },
                id: { not: site.themeVersion.id },
              },
              orderBy: VERSION_ORDER,
            })
          ).map((version) => ({
            id: version.id,
            version: version.version,
            status: version.status,
            changelog: version.changelog,
          })),
        }
      : null;

    const template = site.templateVersion
      ? {
          templateId: site.templateVersion.templateId,
          templateName: site.templateVersion.template.name,
          currentVersionId: site.templateVersion.id,
          currentVersion: site.templateVersion.version,
          currentStatus: site.templateVersion.status,
          available: (
            await this.prisma.templateVersion.findMany({
              where: {
                templateId: site.templateVersion.templateId,
                status: { not: PublishStatus.DEPRECATED },
                id: { not: site.templateVersion.id },
              },
              orderBy: VERSION_ORDER,
            })
          ).map((version) => ({
            id: version.id,
            version: version.version,
            status: version.status,
            changelog: version.changelog,
            /** Whether every block already on the site survives this template. */
            keepsCurrentBlocks: this.instanceVersionIds(site).every((id) =>
              this.allowedBlockVersionIds(version.schema).includes(id),
            ),
          })),
        }
      : null;

    const used = new Map<
      string,
      {
        blockVersionId: string;
        blockDefinitionId: string;
        key: string;
        name: string;
        version: string;
        status: PublishStatus;
        instanceCount: number;
        pages: string[];
      }
    >();

    for (const page of site.pages) {
      for (const instance of page.blocks) {
        const version = instance.blockVersion;
        const entry = used.get(version.id) ?? {
          blockVersionId: version.id,
          blockDefinitionId: version.blockDefinitionId,
          key: version.blockDefinition.key,
          name: version.blockDefinition.name,
          version: version.version,
          status: version.status,
          instanceCount: 0,
          pages: [],
        };
        entry.instanceCount += 1;
        if (!entry.pages.includes(page.name)) {
          entry.pages.push(page.name);
        }
        used.set(version.id, entry);
      }
    }

    const blocks = [];

    for (const entry of used.values()) {
      const candidates = await this.prisma.blockVersion.findMany({
        where: {
          blockDefinitionId: entry.blockDefinitionId,
          status: { not: PublishStatus.DEPRECATED },
          id: { not: entry.blockVersionId },
        },
        orderBy: VERSION_ORDER,
      });

      blocks.push({
        ...entry,
        available: candidates.map((version) => ({
          id: version.id,
          version: version.version,
          status: version.status,
          changelog: version.changelog,
          /**
           * A version the template has not approved cannot be applied. The
           * admin shows it anyway, so the operator sees that the fix is to
           * publish a template version first.
           */
          allowedByTemplate: allowed.includes(version.id),
        })),
      });
    }

    blocks.sort((a, b) => a.key.localeCompare(b.key));

    return { siteId: site.id, siteName: site.name, theme, template, blocks };
  }

  /** What an operator would gain and lose by moving between two block versions. */
  public async previewBlockUpgrade(
    siteId: string,
    fromBlockVersionId: string,
    toBlockVersionId: string,
  ) {
    const { from, to, instances } = await this.resolveBlockUpgrade(
      siteId,
      fromBlockVersionId,
      toBlockVersionId,
    );

    const fromFields = this.fieldsOf(from.schema);
    const toFields = this.fieldsOf(to.schema);
    const toKeys = new Set(toFields.map((field) => field.key));
    const fromKeys = new Set(fromFields.map((field) => field.key));

    const removed = fromFields.filter((field) => !toKeys.has(field.key));
    const added = toFields.filter((field) => !fromKeys.has(field.key));

    /**
     * Content only counts as lost when an instance actually filled the field.
     * A field nobody used disappearing is noise, not a warning.
     */
    const losingContent = new Set<string>();

    for (const instance of instances) {
      const data = (instance.data ?? {}) as Record<string, unknown>;
      for (const field of removed) {
        if (this.hasContent(data[field.key])) {
          losingContent.add(field.key);
        }
      }
    }

    return {
      from: { id: from.id, version: from.version, status: from.status },
      to: { id: to.id, version: to.version, status: to.status },
      instanceCount: instances.length,
      removedFields: removed.map((field) => this.describe(field)),
      addedFields: added.map((field) => this.describe(field)),
      /** Removed fields that at least one instance had filled in. */
      fieldsLosingContent: [...losingContent].sort(),
      requiredFieldsWithoutData: added
        .filter((field) => field.required)
        .map((field) => this.describe(field)),
    };
  }

  /** Repins every instance of one block version on one site. */
  public async applyBlockUpgrade(
    siteId: string,
    fromBlockVersionId: string,
    toBlockVersionId: string,
  ) {
    const { to, instances } = await this.resolveBlockUpgrade(
      siteId,
      fromBlockVersionId,
      toBlockVersionId,
    );

    if (!instances.length) {
      throw new BadRequestException('No blocks on this site use that version.');
    }

    await this.prisma.$transaction(
      instances.map((instance) =>
        this.prisma.blockInstance.update({
          where: { id: instance.id },
          data: { blockVersionId: to.id },
        }),
      ),
    );

    return { updated: instances.length, blockVersionId: to.id, version: to.version };
  }

  /**
   * Repins the site's template.
   *
   * Refused when the new template version would not approve a block the site
   * already contains: that would leave the site in a state its own editor could
   * not reproduce. The operator either widens the template version or upgrades
   * those blocks first.
   */
  public async applyTemplateUpgrade(siteId: string, templateVersionId: string) {
    const site = await this.prisma.site.findUnique({
      where: { id: siteId },
      include: {
        templateVersion: true,
        pages: {
          include: {
            blocks: { include: { blockVersion: { include: { blockDefinition: true } } } },
          },
        },
      },
    });

    if (!site) {
      throw new NotFoundException('Site not found.');
    }

    const target = await this.prisma.templateVersion.findUnique({
      where: { id: templateVersionId },
    });

    if (!target) {
      throw new NotFoundException('Template version not found.');
    }

    if (target.status === PublishStatus.DEPRECATED) {
      throw new BadRequestException('Deprecated template versions cannot be pinned.');
    }

    if (site.templateVersion && target.templateId !== site.templateVersion.templateId) {
      throw new BadRequestException('A site cannot be moved to a different template.');
    }

    const allowed = this.allowedBlockVersionIds(target.schema);
    const orphans = new Set<string>();

    for (const page of site.pages) {
      for (const instance of page.blocks) {
        if (!allowed.includes(instance.blockVersionId)) {
          orphans.add(
            `${instance.blockVersion.blockDefinition.key}@${instance.blockVersion.version}`,
          );
        }
      }
    }

    if (orphans.size) {
      throw new BadRequestException(
        `That template version does not allow blocks already on the site: ${[...orphans].sort().join(', ')}.`,
      );
    }

    return this.prisma.site.update({
      where: { id: siteId },
      data: { templateVersionId: target.id },
    });
  }

  private async resolveBlockUpgrade(
    siteId: string,
    fromBlockVersionId: string,
    toBlockVersionId: string,
  ) {
    if (!fromBlockVersionId || !toBlockVersionId) {
      throw new BadRequestException('Both fromBlockVersionId and toBlockVersionId are required.');
    }

    if (fromBlockVersionId === toBlockVersionId) {
      throw new BadRequestException('The site is already pinned to that block version.');
    }

    const site = await this.prisma.site.findUnique({
      where: { id: siteId },
      include: { templateVersion: true },
    });

    if (!site) {
      throw new NotFoundException('Site not found.');
    }

    const [from, to] = await Promise.all([
      this.prisma.blockVersion.findUnique({ where: { id: fromBlockVersionId } }),
      this.prisma.blockVersion.findUnique({ where: { id: toBlockVersionId } }),
    ]);

    if (!from || !to) {
      throw new NotFoundException('Block version not found.');
    }

    if (from.blockDefinitionId !== to.blockDefinitionId) {
      throw new BadRequestException('An upgrade must stay within the same block.');
    }

    if (to.status === PublishStatus.DEPRECATED) {
      throw new BadRequestException('Deprecated block versions cannot be pinned.');
    }

    if (!this.allowedBlockVersionIds(site.templateVersion?.schema).includes(to.id)) {
      throw new BadRequestException(
        'The template this site is pinned to does not allow that block version. Publish a template version that allows it and repin the site first.',
      );
    }

    const instances = await this.prisma.blockInstance.findMany({
      where: { blockVersionId: from.id, page: { siteId } },
      select: { id: true, data: true },
    });

    return { site, from, to, instances };
  }

  private describe(field: BlockField): FieldChange {
    return {
      key: field.key,
      type: field.type,
      label: field.label ?? null,
      required: field.required === true,
    };
  }

  private fieldsOf(schema: unknown): BlockField[] {
    const parsed = (schema ?? {}) as BlockSchema;
    return Array.isArray(parsed.fields) ? [...parsed.fields] : [];
  }

  private hasContent(value: unknown): boolean {
    if (value === undefined || value === null) {
      return false;
    }

    if (typeof value === 'string') {
      return value.trim().length > 0;
    }

    if (Array.isArray(value)) {
      return value.length > 0;
    }

    return true;
  }

  private instanceVersionIds(site: {
    pages: { blocks: { blockVersionId: string }[] }[];
  }): string[] {
    return [...new Set(site.pages.flatMap((page) => page.blocks.map((b) => b.blockVersionId)))];
  }

  private allowedBlockVersionIds(schema: unknown): string[] {
    const parsed = (schema ?? {}) as TemplateSchema;
    return Array.isArray(parsed.allowedBlockVersionIds) ? parsed.allowedBlockVersionIds : [];
  }
}
