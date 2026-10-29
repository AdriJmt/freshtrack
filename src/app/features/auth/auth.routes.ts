import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: 'connexion',
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'inscription',
    loadComponent: () =>
      import('./pages/register/register.component').then(
        (m) => m.RegisterComponent,
      ),
  },
];
