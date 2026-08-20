import { AllEnterpriseModule, LicenseManager } from 'ag-grid-enterprise';
import { AgGridAngular } from 'ag-grid-angular';
import { AllCommunityModule, CellStyleModule, ModuleRegistry } from 'ag-grid-community';
import {
  ColumnsToolPanelModule,
  ContextMenuModule,
  MultiFilterModule,
  RowGroupingModule,
  RowGroupingPanelModule,
  ServerSideRowModelModule,
  SetFilterModule,
  SideBarModule,
  TreeDataModule,
} from 'ag-grid-enterprise';
import { FiltersToolPanelModule } from 'ag-grid-enterprise';
import './grid-license';

import { GridDefaultOptionsDirective } from './grid-default.directive';

declare global {
  // Optional runtime licence injection for Admin and Studio.
  // AG Grid licence keys are client-side by design and are not secrets.
  var __PROTO_AG_GRID_LICENSE_KEY__: string | undefined;
}

let configured = false;

export function configureAgGrid(licenseKey?: string): void {
  if (configured) {
    return;
  }

  ModuleRegistry.registerModules([
    AllCommunityModule,
    SideBarModule,
    ColumnsToolPanelModule,
    RowGroupingModule,
    RowGroupingPanelModule,
    SetFilterModule,
    ServerSideRowModelModule,
    ContextMenuModule,
    CellStyleModule,
    TreeDataModule,
    FiltersToolPanelModule,
    MultiFilterModule,
  ]);

  const resolvedLicenseKey = licenseKey ?? globalThis.__PROTO_AG_GRID_LICENSE_KEY__;
  if (resolvedLicenseKey) {
    LicenseManager.setLicenseKey(resolvedLicenseKey);
  }

  configured = true;
}

export { GridDefaultOptionsDirective as GridSmallOptionsDirective };

export const AgGridImports = [AgGridAngular, GridDefaultOptionsDirective];
