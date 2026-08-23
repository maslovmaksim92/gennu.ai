export type FieldType = 'text' | 'richtext' | 'url' | 'image' | 'number' | 'boolean' | 'list';

export interface BlockField {
  key: string;
  type: FieldType;
  label?: string;
  required?: boolean;
  /** Item shape for a `list` field. */
  fields?: BlockField[];
}

export interface BlockSchema {
  fields?: BlockField[];
  layout?: unknown;
  css?: string;
}

export interface BlockInstanceRow {
  id: string;
  blockVersionId: string;
  data: Record<string, unknown>;
  settings: Record<string, unknown>;
  sortOrder: number;
  blockVersion: {
    id: string;
    version: string;
    schema: BlockSchema;
    defaults: Record<string, unknown> | null;
    blockDefinition: { key: string; name: string };
  };
}

export interface PageRow {
  id: string;
  siteId: string;
  name: string;
  slug: string;
  blocks: BlockInstanceRow[];
}

export interface SiteDetail {
  id: string;
  name: string;
  templateVersion: { version: string; template: { name: string } } | null;
  themeVersion: { id: string; version: string; theme: { name: string } } | null;
  pages: PageRow[];
}

export interface PaletteEntry {
  blockVersionId: string;
  key: string;
  name: string;
  description: string | null;
  version: string;
  schema: BlockSchema;
  defaults: Record<string, unknown> | null;
}

export interface SiteListRow {
  id: string;
  name: string;
  pageCount: number;
  themeName: string | null;
  themeVersion: string | null;
  templateName: string | null;
  templateVersion: string | null;
  updatedAt: string;
}
