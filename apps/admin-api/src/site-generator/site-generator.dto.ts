import { IsString, MaxLength, MinLength } from 'class-validator';

export class GenerateSiteDto {
  @IsString()
  templateVersionId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  prompt!: string;
}
