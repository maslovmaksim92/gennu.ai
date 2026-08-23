import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { IsJsonObject } from '../common/dto';

export class SaveIntegrationDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsIn(['CONNECTED', 'DISCONNECTED', 'ERROR'])
  status?: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';

  @IsOptional()
  @IsJsonObject()
  config?: Record<string, unknown>;

  /** Write-only: stored encrypted and never returned. */
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  secret?: string;
}
