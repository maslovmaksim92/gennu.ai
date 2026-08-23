import type { PublishStatus } from '../shared/version-panel.types';

export interface TemplateRow {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  versionId: string | null;
  version: string | null;
  status: PublishStatus | null;
  schema: { allowedBlockVersionIds?: string[] } & Record<string, unknown>;
  updatedAt: string;
}
