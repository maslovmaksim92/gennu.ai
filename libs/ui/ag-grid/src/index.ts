import { ModuleRegistry } from 'ag-grid-community';
import { AllEnterpriseModule, LicenseManager } from 'ag-grid-enterprise';
import { AgGridAngular } from 'ag-grid-angular';

declare global {
  // Optional runtime licence injection for Admin and Studio.
  // AG Grid licence keys are client-side by design and are not secrets.
  var __PROTO_AG_GRID_LICENSE_KEY__: string | undefined;
}

let configured = false;

export function configureAgGridEnterprise(licenseKey?: string): void {
  if (configured) {
    return;
  }

  ModuleRegistry.registerModules([AllEnterpriseModule]);

  const resolvedLicenseKey = licenseKey ?? globalThis.__PROTO_AG_GRID_LICENSE_KEY__;
  if (resolvedLicenseKey) {
    LicenseManager.setLicenseKey(resolvedLicenseKey);
  }

  configured = true;
}

export const AgGridImports = [AgGridAngular];
