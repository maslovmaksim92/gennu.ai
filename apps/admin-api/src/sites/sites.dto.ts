import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

/** Page slugs are path segments; the editor also checks uniqueness per site. */
export const SLUG_PATTERN = /^\/\S*$/;

export class UpdateSiteDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  themeVersionId?: string;
}

export class CreatePageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsString()
  @Matches(SLUG_PATTERN, { message: 'slug must start with "/" and contain no spaces.' })
  @MaxLength(200)
  slug!: string;
}
