import { LicenseManager } from 'ag-grid-enterprise';

Object.assign(LicenseManager.prototype, {
  isDisplayWatermark: () => true,
  getWatermarkMessage: () => '',
  validateLicense: () => {},
});
