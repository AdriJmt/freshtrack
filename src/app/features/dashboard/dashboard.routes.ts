import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth.guard';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layouts/dashboard-layout/dashboard-layout.component').then(
        (m) => m.DashboardLayoutComponent,
      ),
    children: [
      {
        path: '',
        title: 'Tableau de bord | FreshTrack',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: 'produits',
        title: 'Produits | FreshTrack',
        loadComponent: () =>
          import('./pages/products/products.component').then(
            (m) => m.ProductsComponent,
          ),
      },
      {
        path: 'stockages',
        title: 'Stockages | FreshTrack',
        loadComponent: () =>
          import('./pages/storages/storages.component').then(
            (m) => m.StoragesComponent,
          ),
      },
    ],
  },
];
