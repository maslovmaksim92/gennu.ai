import { Directive, inject, AfterViewInit } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import { AutoGroupColumnDef, Column, ICellRendererParams } from 'ag-grid-community';
import { debounceTime, startWith, Subject, tap } from 'rxjs';
import { bigGridDefaultColDef, pageSizeSelector } from './grid-options';
import { gridLocale } from './grid-locale';
import { CellTemplateHostDirective } from './cell-template-render/grid-template.directive';
import { GridThemeDirective } from './grid-theme/grid-theme.directive';

const autoGroupColumnDef: AutoGroupColumnDef = {
  pinned: 'left',
  maxWidth: 400,
  cellRendererParams: {
    suppressCount: true,
    innerRenderer: (params: ICellRendererParams) => {
      if (!params.node.group) {
        return '';
      }

      let value = params.valueFormatted ?? params.node.key;
      // Дату с временем группируем по дате, срезаем время
      if (value && new Date(params.value).toString() !== 'Invalid Date') {
        value = value.split(' ')[0];
      }
      const rowGroupColumn = params.node.rowGroupColumn;
      const count = params.node.allChildrenCount;
      const headerName = params.api.getDisplayNameForColumn(rowGroupColumn as Column<any>, null);
      return `${headerName}: ${value} (${$localize`Кол-во`}: ${count})`;
    },
  },
};

@Directive({
  selector: 'ag-grid-angular[ppGridLg]',
  hostDirectives: [CellTemplateHostDirective, GridThemeDirective],
})
export class PPGridLargeOptionsDirective implements AfterViewInit {
  private readonly agGridAngular = inject(AgGridAngular);

  protected readonly updateFitGridWidth$ = new Subject<void>();

  constructor() {
    this.agGridAngular.animateRows = true;
    this.agGridAngular.rowGroupPanelShow = 'always';
    this.agGridAngular.localeText = gridLocale;
    this.agGridAngular.defaultColDef = Object.assign(
      {},
      this.agGridAngular.defaultColDef ?? {},
      bigGridDefaultColDef,
    );
    this.agGridAngular.autoGroupColumnDef = Object.assign(
      {},
      this.agGridAngular.autoGroupColumnDef ?? {},
      autoGroupColumnDef,
    );
    this.agGridAngular.enableBrowserTooltips = true;
    this.agGridAngular.pagination = true;
    this.agGridAngular.paginationPageSizeSelector = [...pageSizeSelector];
    this.agGridAngular.paginationPageSize = pageSizeSelector[0];
    this.agGridAngular.suppressDragLeaveHidesColumns = true;
    this.agGridAngular.suppressContextMenu = true;
    this.agGridAngular.rowHeight = 32;
    this.agGridAngular.accentedSort = true;
    this.agGridAngular.autoGroupColumnDef = { minWidth: 200, pinned: true };
  }

  ngAfterViewInit(): void {
    const { api } = this.agGridAngular;
    /*
      https://www.ag-grid.com/angular-data-grid/column-sizing/
    */
    api.addEventListener('columnVisible', () =>
      this.agGridAngular.api.autoSizeColumns({ scaleUpToFitGridWidth: true }),
    );
    api.addEventListener('columnsReset', () =>
      this.agGridAngular.api.autoSizeColumns({ scaleUpToFitGridWidth: true }),
    );
    api.addEventListener('toolPanelSizeChanged', () => this.updateFitGridWidth$.next());
    api.addEventListener('toolPanelVisibleChanged', () =>
      this.agGridAngular.api.autoSizeColumns({ scaleUpToFitGridWidth: true }),
    );

    this.updateFitGridWidth$
      .pipe(
        debounceTime(400),
        startWith(undefined),
        tap(() => {
          this.agGridAngular.api.autoSizeColumns({ scaleUpToFitGridWidth: true });
        }),
      )
      .subscribe();
  }
}
