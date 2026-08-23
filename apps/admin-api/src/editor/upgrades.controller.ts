import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { AdminGuard } from '../common/admin.guard';
import { UpgradesService } from './upgrades.service';

/**
 * Explicit version moves for one site.
 *
 * Kept apart from the editor's content routes on purpose: editing content must
 * never be able to change a pinned version, and changing a pinned version is a
 * deliberate act with its own preview.
 */
@Controller('sites')
@UseGuards(JwtGuard, AdminGuard)
export class UpgradesController {
  public constructor(private readonly upgrades: UpgradesService) {}

  @Get(':id/upgrades')
  public overview(@Param('id') id: string) {
    return this.upgrades.overview(id);
  }

  @Post(':id/upgrades/blocks/preview')
  public previewBlocks(@Param('id') id: string, @Body() body: any) {
    return this.upgrades.previewBlockUpgrade(id, body?.fromBlockVersionId, body?.toBlockVersionId);
  }

  @Post(':id/upgrades/blocks')
  public applyBlocks(@Param('id') id: string, @Body() body: any) {
    return this.upgrades.applyBlockUpgrade(id, body?.fromBlockVersionId, body?.toBlockVersionId);
  }

  @Post(':id/upgrades/template')
  public applyTemplate(@Param('id') id: string, @Body() body: any) {
    return this.upgrades.applyTemplateUpgrade(id, body?.templateVersionId);
  }
}
