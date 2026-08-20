import { bootstrapApplication } from '@angular/platform-browser';
import { configureAgGrid } from '@atlas/ui-ag-grid';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

configureAgGrid();

bootstrapApplication(AppComponent, appConfig).catch(console.error);
