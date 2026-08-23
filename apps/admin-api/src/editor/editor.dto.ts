import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { IsJsonObject } from '../common/dto';
import { SLUG_PATTERN } from '../sites/sites.dto';

export class UpdatePageDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(SLUG_PATTERN, { message: 'slug must start with "/" and contain no spaces.' })
  @MaxLength(200)
  slug?: string;
}

export class AddBlockDto {
  @IsString()
  blockVersionId!: string;

  @IsOptional()
  @IsJsonObject()
  data?: Record<string, unknown>;

  @IsOptional()
  @IsJsonObject()
  settings?: Record<string, unknown>;
}

/**
 * The list must name every block on the page exactly once — the controller
 * still checks that against the stored page, since only it knows the page.
 */
export class ReorderBlocksDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  ids!: string[];
}

export class UpdateBlockInstanceDto {
  @IsOptional()
  @IsJsonObject()
  data?: Record<string, unknown>;

  @IsOptional()
  @IsJsonObject()
  settings?: Record<string, unknown>;
}

export class BlockUpgradeDto {
  @IsString()
  fromBlockVersionId!: string;

  @IsString()
  toBlockVersionId!: string;
}

export class TemplateUpgradeDto {
  @IsString()
  templateVersionId!: string;
}
