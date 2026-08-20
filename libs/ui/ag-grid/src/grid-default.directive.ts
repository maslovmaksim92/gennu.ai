import { Directive, inject } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import { CellTemplateHostDirective } from './cell-template-render/grid-template.directive';
import { GridThemeDirective } from './grid-theme/grid-theme.directive';
import { defaultColDef, pageSizeSelector } from './grid-options';
import { gridLocale } from './grid-locale';

@Directive({
  selector: 'ag-grid-angular',
  hostDirectives: [GridThemeDirective],
})
export class GridDefaultOptionsDirective {
  private readonly agGridAngular = inject(AgGridAngular);

  constructor() {
    this.agGridAngular.animateRows = true;
    this.agGridAngular.rowGroupPanelShow = 'never';
    this.agGridAngular.localeText = gridLocale;
    this.agGridAngular.defaultColDef = Object.assign({}, defaultColDef, this.agGridAngular.defaultColDef ?? {});
    this.agGridAngular.enableBrowserTooltips = true;
    this.agGridAngular.pagination = true;
    this.agGridAngular.paginationPageSizeSelector = false;
    this.agGridAngular.paginationPageSize = pageSizeSelector[0];
    this.agGridAngular.suppressDragLeaveHidesColumns = true;
    this.agGridAngular.rowHeight = 32;
    this.agGridAngular.accentedSort = true;
    this.agGridAngular.domLayout = 'autoHeight';
  }
}
