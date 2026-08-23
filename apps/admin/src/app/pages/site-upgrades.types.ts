import type { PublishStatus } from '../shared/version-panel.types';

export interface UpgradeCandidate {
  id: string;
  version: string;
  status: PublishStatus;
  changelog: string | null;
  allowedByTemplate?: boolean;
  keepsCurrentBlocks?: boolean;
}

export interface ThemeUpgrade {
  themeId: string;
  themeName: string;
  currentVersionId: string;
  currentVersion: string;
  currentStatus: PublishStatus;
  available: UpgradeCandidate[];
}

export interface TemplateUpgrade {
  templateId: string;
  templateName: string;
  currentVersionId: string;
  currentVersion: string;
  currentStatus: PublishStatus;
  available: UpgradeCandidate[];
}

export interface BlockUpgrade {
  blockVersionId: string;
  blockDefinitionId: string;
  key: string;
  name: string;
  version: string;
  status: PublishStatus;
  instanceCount: number;
  pages: string[];
  available: UpgradeCandidate[];
}

export interface UpgradeOverview {
  siteId: string;
  siteName: string;
  theme: ThemeUpgrade | null;
  template: TemplateUpgrade | null;
  blocks: BlockUpgrade[];
}

export interface FieldChange {
  key: string;
  type: string;
  label: string | null;
  required: boolean;
}

export interface BlockUpgradePreview {
  from: { id: string; version: string; status: PublishStatus };
  to: { id: string; version: string; status: PublishStatus };
  instanceCount: number;
  removedFields: FieldChange[];
  addedFields: FieldChange[];
  fieldsLosingContent: string[];
  requiredFieldsWithoutData: FieldChange[];
}

export interface SiteUpgradesData {
  siteId: string;
  siteName: string;
}
