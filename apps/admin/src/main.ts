import { bootstrapApplication } from '@angular/platform-browser';
import { configureAgGridEnterprise } from '@proto/ui-ag-grid';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

configureAgGridEnterprise();

bootstrapApplication(AppComponent, appConfig).catch(console.error);
