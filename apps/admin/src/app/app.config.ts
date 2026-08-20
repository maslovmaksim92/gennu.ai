import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideTaiga, tuiAssetsPathProvider } from '@taiga-ui/core';
import { routes } from './app.routes';
import { authTokenInterceptor } from './core/auth-token.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authTokenInterceptor])),
    tuiAssetsPathProvider('/assets/taiga-ui/icons'),
    provideTaiga(),
  ],
};
