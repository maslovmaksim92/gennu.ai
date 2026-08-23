import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { IsJsonObject, KEY_PATTERN, SEMVER_PATTERN } from './dto';

/**
 * Themes, blocks and templates version identically, so their request bodies do
 * too. Each module extends these with whatever is specific to it.
 */
export class CreateVersionedResourceDto {
  @IsString()
  @Matches(KEY_PATTERN, {
    message: 'key must be lowercase letters, digits and dashes, starting with a letter or digit.',
  })
  @MaxLength(64)
  key!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsJsonObject()
  schema?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  changelog?: string;
}

export class UpdateResourceDefinitionDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class CreateVersionDto {
  @IsString()
  @Matches(SEMVER_PATTERN, { message: 'version must use MAJOR.MINOR.PATCH format.' })
  version!: string;

  @IsOptional()
  @IsJsonObject()
  schema?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  changelog?: string;

  @IsOptional()
  @IsJsonObject()
  migration?: Record<string, unknown>;
}

export class UpdateDraftVersionDto {
  @IsOptional()
  @IsJsonObject()
  schema?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  changelog?: string;

  @IsOptional()
  @IsJsonObject()
  migration?: Record<string, unknown>;
}
