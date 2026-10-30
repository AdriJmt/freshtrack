import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'connexion',
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: 'inscription',
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: '',
    loadChildren: () =>
      import('./features/dashboard/dashboard.routes').then(
        (m) => m.DASHBOARD_ROUTES,
      ),
  },
  {
    path: '**',
    redirectTo: 'connexion',
  },
];
