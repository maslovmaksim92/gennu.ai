export type PublishStatus = 'DRAFT' | 'PUBLISHED' | 'DEPRECATED';

/** The three design-system resources share one versioning contract. */
export type VersionedKind = 'themes' | 'blocks' | 'templates';

export interface VersionRow {
  id: string;
  version: string;
  major: number;
  minor: number;
  patch: number;
  status: PublishStatus;
  changelog: string | null;
  publishedAt: string | null;
  createdAt: string;
  schema: Record<string, unknown>;
  defaults?: Record<string, unknown> | null;
}

export interface VersionUsage {
  siteCount: number;
  instanceCount?: number;
  sites: { id: string; name: string; instanceCount?: number }[];
}

export interface RenderCheck {
  renderable: boolean;
  issues: string[];
}

export interface VersionPanelData {
  kind: VersionedKind;
  id: string;
  title: string;
}

/** A published block version, offered when a template picks what it allows. */
export interface BlockVersionOption {
  id: string;
  version: string;
  status: PublishStatus;
  key: string;
  name: string;
}
