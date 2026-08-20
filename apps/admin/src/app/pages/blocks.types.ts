import { PublishStatus } from './themes.types';

export interface BlockRow {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  versionId: string | null;
  version: string | null;
  status: PublishStatus | null;
  schema: Record<string, unknown>;
  defaults: Record<string, unknown>;
  updatedAt: string;
}
