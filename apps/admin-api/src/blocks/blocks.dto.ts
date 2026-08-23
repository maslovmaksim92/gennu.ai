import { IsOptional } from 'class-validator';
import { IsJsonObject } from '../common/dto';
import {
  CreateVersionDto,
  CreateVersionedResourceDto,
  UpdateDraftVersionDto,
} from '../common/versioned.dto';

/** Blocks carry `defaults` on top of the shared versioning fields. */
export class CreateBlockDto extends CreateVersionedResourceDto {
  @IsOptional()
  @IsJsonObject()
  defaults?: Record<string, unknown>;
}

export class CreateBlockVersionDto extends CreateVersionDto {
  @IsOptional()
  @IsJsonObject()
  defaults?: Record<string, unknown>;
}

export class UpdateBlockDraftVersionDto extends UpdateDraftVersionDto {
  @IsOptional()
  @IsJsonObject()
  defaults?: Record<string, unknown>;
}
