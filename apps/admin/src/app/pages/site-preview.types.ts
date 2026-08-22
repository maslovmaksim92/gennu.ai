export interface SiteRow {
  id: string;
  name: string;
  pageCount: number;
  themeName: string | null;
  themeVersion: string | null;
  templateName: string | null;
  templateVersion: string | null;
  updatedAt: string;
}

export interface SitePageRow {
  id: string;
  name: string;
  slug: string;
}

export interface PreviewTokenResponse {
  token: string;
  url: string;
  expiresIn: number;
}

export interface RenderIssueRow {
  blockId?: string;
  path: string;
  message: string;
}

export type PreviewViewport = 'desktop' | 'tablet' | 'mobile';
