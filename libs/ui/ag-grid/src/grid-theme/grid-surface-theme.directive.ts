import { AfterViewInit, Directive, ElementRef, Input, OnDestroy, inject } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import { GridApi } from 'ag-grid-community';
import { Subscription } from 'rxjs';
import { GridSurfaceDark, GridSurfaceLight } from './grid-surface.theme';
import { AppTheme, ThemeService } from './theme.service';

@Directive({
  selector: '[agGridSurfaceTheme]',
})
export class GridSurfaceThemeDirective implements AfterViewInit, OnDestroy {
  private readonly themeService = inject(ThemeService);
  private readonly elementRef = inject(ElementRef);

  @Input({ required: true }) agGridSurfaceTheme: AgGridAngular;
  @Input() classList: string[] = [];

  private theme = AppTheme.Dark;

  private subscriptions = new Subscription();

  ngAfterViewInit() {
    this.subscriptions.add(
      this.themeService.theme$.subscribe((theme) => {
        this.theme = theme;

        this.updateTheme();
      }),
    );

    this.elementRef.nativeElement.classList.add('ag-theme-surface');

    this.classList?.forEach((className) => {
      this.elementRef.nativeElement.classList.add(className);
    });
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private updateTheme() {
    const api: GridApi<unknown> = this.agGridSurfaceTheme.api;
    api.setGridOption('loadThemeGoogleFonts', false);

    const theme = this.theme === AppTheme.Dark ? GridSurfaceDark : GridSurfaceLight;

    api.setGridOption('theme', theme);
  }
}
