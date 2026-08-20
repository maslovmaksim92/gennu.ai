import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideTaiga, tuiAssetsPathProvider } from '@taiga-ui/core';
import { TUI_LANGUAGE, TUI_RUSSIAN_LANGUAGE } from '@taiga-ui/i18n';
import { routes } from './app.routes';
import { authTokenInterceptor } from './core/auth-token.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authTokenInterceptor])),
    tuiAssetsPathProvider('/assets/taiga-ui/icons'),
    {
      provide: TUI_LANGUAGE,
      useValue: signal(TUI_RUSSIAN_LANGUAGE),
    },
    provideTaiga(),
  ],
};
