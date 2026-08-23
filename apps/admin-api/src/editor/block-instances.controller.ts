import {
  Body,
  Controller,
  Delete,
  NotFoundException,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { AdminGuard } from '../common/admin.guard';
import { PrismaService } from '../common/prisma.service';
import { EditorService } from './editor.service';

@Controller('block-instances')
@UseGuards(JwtGuard, AdminGuard)
export class BlockInstancesController {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly editor: EditorService,
  ) {}

  /**
   * Updates one block's content.
   *
   * `blockVersionId` is deliberately not writable here: moving an instance to
   * another block version is a version migration, not an edit.
   */
  @Patch(':id')
  public async update(@Param('id') id: string, @Body() body: any) {
    const instance = await this.prisma.blockInstance.findUnique({ where: { id } });

    if (!instance) {
      throw new NotFoundException('Block instance not found.');
    }

    return this.prisma.blockInstance.update({
      where: { id },
      data: {
        data: body.data === undefined ? undefined : this.editor.asJsonObject(body.data, 'data'),
        settings:
          body.settings === undefined
            ? undefined
            : this.editor.asJsonObject(body.settings, 'settings'),
      },
    });
  }

  @Delete(':id')
  public async remove(@Param('id') id: string) {
    const instance = await this.prisma.blockInstance.findUnique({ where: { id } });

    if (!instance) {
      throw new NotFoundException('Block instance not found.');
    }

    await this.prisma.blockInstance.delete({ where: { id } });
    return this.editor.pageOrFail(instance.pageId);
  }
}
