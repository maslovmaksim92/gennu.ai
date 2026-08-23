/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @angular-eslint/prefer-inject */
import {
  Component,
  inject,
  signal,
  DestroyRef,
  ElementRef,
  effect,
  AfterContentInit,
} from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ColDef, ICellRendererParams } from 'ag-grid-community';
import { injectCellRender } from './grid-template.directive';

export interface CellActionParams extends ICellRendererParams {
  templateName: string;
}

export function cellTemplateRender(
  templateName: string,
): Pick<ColDef, 'cellRenderer' | 'cellRendererParams'> {
  return {
    cellRenderer: CellTemplateRenderComponent,
    cellRendererParams: {
      templateName,
    },
  };
}

@Component({
  selector: 'grid-cell-template-render',
  template: '',
})
export class CellTemplateRenderComponent<T extends ICellRendererParams>
  implements ICellRendererAngularComp, AfterContentInit
{
  protected readonly destroyRef = inject(DestroyRef);
  protected readonly cellValue = signal(null);
  protected readonly params = signal(null);
  protected readonly templateName = signal(null);
  protected readonly elementRef = inject(ElementRef);
  protected readonly cellRenderFn = injectCellRender();

  ngAfterContentInit() {
    if (this.templateName()) {
      this.cellRenderFn(this.templateName()!, {
        index: 0,
        model: this.getRowData(),
        elementContainer: this.elementRef.nativeElement,
      });
    }
  }

  agInit(params: CellActionParams): void {
    this.params.set(params);
    this.templateName.set(params.templateName);
  }

  /*
    Для запуска метода обновления при изменении данных необходим метод обновления сетки ag grid.
    example: gridApi.refreshCells({force: true}); gridApi.refreshClientSideRowModel and others
  */
  refresh(params: CellActionParams): boolean {
    this.params.set(params);
    this.templateName.set(params.templateName);
    return true;
  }

  /*
    Получает реальные данные из API, поскольку params.data не всегда содержит реально обновляемые поля.
    const { api, node } = this.params();
    return api.getRowNode(node.id)?.data;
  */
  protected getRowData(): T {
    const { data } = this.params();
    return data;
  }
}
