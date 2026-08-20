import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export enum AppTheme {
  Light = 'light-theme',
  Dark = 'dark-theme',
}

const DEFAULT_THEME = AppTheme.Dark;

const StorageKey = 'mon-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  public theme$ = new BehaviorSubject(DEFAULT_THEME);
  public themeValue = DEFAULT_THEME;

  constructor() {
    const theme = localStorage.getItem(StorageKey) as AppTheme;
    this.themeValue = theme || DEFAULT_THEME;

    if (theme === AppTheme.Light) {
      this.theme$.next(AppTheme.Light);
      document.body.classList.add(this.themeValue);
    }
  }

  public onToggleTheme() {
    if (this.themeValue === AppTheme.Dark) {
      this.themeValue = AppTheme.Light;
    } else {
      this.themeValue = AppTheme.Dark;
    }

    document.body.classList.remove(AppTheme.Dark, AppTheme.Light);
    document.body.classList.add(this.themeValue);

    localStorage.setItem(StorageKey, this.themeValue);
    this.theme$.next(this.themeValue);
  }
}
