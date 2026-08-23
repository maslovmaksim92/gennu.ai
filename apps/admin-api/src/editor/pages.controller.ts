import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { AdminGuard } from '../common/admin.guard';
import { PrismaService } from '../common/prisma.service';
import { EditorService, PAGE_INCLUDE } from './editor.service';

@Controller('pages')
@UseGuards(JwtGuard, AdminGuard)
export class PagesController {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly editor: EditorService,
  ) {}

  @Get(':id')
  public get(@Param('id') id: string) {
    return this.editor.pageOrFail(id);
  }

  @Patch(':id')
  public async update(@Param('id') id: string, @Body() body: any) {
    const page = await this.editor.pageOrFail(id);
    const slug =
      typeof body.slug === 'string'
        ? await this.editor.assertUsableSlug(page.siteId, body.slug, page.id)
        : undefined;

    return this.prisma.page.update({
      where: { id },
      data: {
        name: typeof body.name === 'string' ? body.name.trim() : undefined,
        slug,
      },
      include: PAGE_INCLUDE,
    });
  }

  @Delete(':id')
  public async remove(@Param('id') id: string) {
    const page = await this.editor.pageOrFail(id);
    const remaining = await this.prisma.page.count({ where: { siteId: page.siteId } });

    if (remaining <= 1) {
      throw new BadRequestException('A site must keep at least one page.');
    }

    await this.prisma.page.delete({ where: { id } });
    return { id };
  }

  /** Appends a block instance, seeded with the block version's defaults. */
  @Post(':id/blocks')
  public async addBlock(@Param('id') id: string, @Body() body: any) {
    const page = await this.editor.pageOrFail(id);
    const version = await this.editor.assertBlockVersionAllowed(page.siteId, body.blockVersionId);
    const last = await this.prisma.blockInstance.findFirst({
      where: { pageId: id },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    await this.prisma.blockInstance.create({
      data: {
        pageId: id,
        blockVersionId: version.id,
        data: this.editor.asJsonObject(body.data ?? version.defaults ?? {}, 'data'),
        settings: this.editor.asJsonObject(body.settings ?? {}, 'settings'),
        sortOrder: (last?.sortOrder ?? -1) + 1,
      },
    });

    return this.editor.pageOrFail(id);
  }

  /**
   * Rewrites the order of the page's blocks.
   *
   * The request must list every block on the page exactly once: a partial list
   * would leave the remaining blocks with colliding sort orders.
   */
  @Post(':id/blocks/reorder')
  public async reorder(@Param('id') id: string, @Body() body: any) {
    const page = await this.editor.pageOrFail(id);
    const ids: unknown = body.ids;

    if (!Array.isArray(ids) || ids.some((value) => typeof value !== 'string')) {
      throw new BadRequestException('ids must be an array of block instance ids.');
    }

    const current = page.blocks.map((block) => block.id);
    const next = ids as string[];

    if (next.length !== current.length || new Set(next).size !== next.length) {
      throw new BadRequestException('ids must list every block on the page exactly once.');
    }

    if (next.some((value) => !current.includes(value))) {
      throw new BadRequestException('ids must only contain blocks from this page.');
    }

    await this.prisma.$transaction(
      next.map((blockId, index) =>
        this.prisma.blockInstance.update({ where: { id: blockId }, data: { sortOrder: index } }),
      ),
    );

    return this.editor.pageOrFail(id);
  }
}
