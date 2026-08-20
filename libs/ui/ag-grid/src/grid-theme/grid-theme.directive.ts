import { Directive, inject } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import { iconOverrides, themeQuartz } from 'ag-grid-community';

@Directive({
  selector: '[gridTheme]',
})
export class GridThemeDirective {
  private readonly agGridAngular = inject(AgGridAngular);

  constructor() {
    this.agGridAngular.theme ??= themeQuartz
      .withPart(
        iconOverrides({
          type: 'image',
          mask: true,
          icons: {
            // map of icon names to images
            'grid-export': {
              svg: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><g stroke="#7F8C8D" fill="none" fill-rule="evenodd"><path d="M10.5 6V4.5h-5v.532a1 1 0 0 0 .36.768l1.718 1.432a1 1 0 0 1 0 1.536L5.86 10.2a1 1 0 0 0-.36.768v.532h5V10"/><rect x="1.5" y="1.5" width="13" height="13" rx="2"/></g></svg>',
            },
          },
        })
      )
      .withParams({
        headerVerticalPaddingScale: 0.5,
        headerHeight: 36,
      });
  }
}

/*
  const gridThemes = {
    [AppTheme.Dark]: 'ag-theme-alpine-dark',
    [AppTheme.Light]: 'ag-theme-alpine',
  };
  private readonly themeService = inject(ThemeService);
  private readonly elementRef = inject(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private theme = AppTheme.Dark;

  ngAfterViewInit() {
    this.themeService.theme$
      .pipe(
        tap((theme) => {
          this.theme = theme;

          this.agGridAngular.api.setGridOption('loadThemeGoogleFonts', false);
          this.agGridAngular.api.setGridOption(
            'theme',
            this.theme === THEME.Dark ? GridSurfaceDark : GridSurfaceLight
          );

          const host = this.elementRef.nativeElement as HTMLElement;
          host.classList.add('ag-theme-es');
          host.classList.add('ag-theme-surface');

          host.classList.toggle(gridThemes[AppTheme.Dark], this.theme === AppTheme.Dark);
          host.classList.toggle(gridThemes[AppTheme.Light], this.theme === AppTheme.Light);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }
*/
