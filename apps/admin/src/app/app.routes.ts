import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
export const routes: Routes = [
  {
    path: 'login', loadComponent: () => import('./pages/login.component').then(m => m.LoginComponent)
  },
  {
    path: '', canActivate: [
      authGuard
    ], loadComponent: () => import('./layout/admin-layout.component').then(m => m.AdminLayoutComponent), children: [
      {
        path: '', pathMatch: 'full', redirectTo: 'dashboard'
      },
      {
        path: 'dashboard', loadComponent: () => import('./pages/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'admins', loadComponent: () => import('./pages/admins.component').then(m => m.AdminsComponent)
      },
      {
        path: 'users', loadComponent: () => import('./pages/users.component').then(m => m.UsersComponent)
      },
      {
        path: 'themes', loadComponent: () => import('./pages/themes.component').then(m => m.ThemesComponent)
      },
      {
        path: 'blocks', loadComponent: () => import('./pages/blocks.component').then(m => m.BlocksComponent)
      },
      {
        path: 'integrations', loadComponent: () => import('./pages/integrations.component').then(m => m.IntegrationsComponent)
      },
      {
        path: 'ai', loadComponent: () => import('./pages/ai.component').then(m => m.AiComponent)
      }
    ]
  },
  {
    path: '**', redirectTo: ''
  }
];
