export type PublishStatus = 'DRAFT' | 'PUBLISHED' | 'DEPRECATED';

export interface ThemeRow {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  versionId: string | null;
  version: string | null;
  status: PublishStatus | null;
  schema: Record<string, unknown>;
  updatedAt: string;
}
