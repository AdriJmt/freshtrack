import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { guestGuard } from './core/guest.guard';

export const routes: Routes = [
  // Authentification
  {
    path: 'connexion',
    title: 'Connexion | FreshTrack',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/pages/login/login.component').then(
        (m) => m.LoginComponent,
      ),
  },
  {
    path: 'inscription',
    title: 'Inscription | FreshTrack',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/pages/register/register.component').then(
        (m) => m.RegisterComponent,
      ),
  },

  // Application
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/layouts/dashboard-layout/dashboard-layout.component').then(
        (m) => m.DashboardLayoutComponent,
      ),
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: 'Tableau de bord | FreshTrack',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: 'produits',
        title: 'Produits | FreshTrack',
        loadComponent: () =>
          import('./features/dashboard/pages/products/products.component').then(
            (m) => m.ProductsComponent,
          ),
      },
      {
        path: 'stockages',
        title: 'Stockages | FreshTrack',
        loadComponent: () =>
          import('./features/dashboard/pages/storages/storages.component').then(
            (m) => m.StoragesComponent,
          ),
      },
    ],
  },

  // Route inconnue
  {
    path: '**',
    redirectTo: '',
  },
];
