import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridThemeDirective } from './grid-theme.directive';

/*
  https://www.ag-grid.com/theme-builder/
*/
@NgModule({
  declarations: [GridThemeDirective],
  imports: [CommonModule],
  exports: [GridThemeDirective],
})
export class GridThemeModule {}
