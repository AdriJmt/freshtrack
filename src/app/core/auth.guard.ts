import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = async (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Attend que Supabase ait déterminé l'état de la session.
  await firstValueFrom(
    toObservable(authService.isInitialized).pipe(
      filter((initialized) => initialized),
    ),
  );

  // Autorise l'accès si l'utilisateur est connecté.
  if (authService.isAuthenticated()) {
    return true;
  }

  // Redirige vers la connexion si l'utilisateur est déconnecté.
  return router.createUrlTree(['/connexion'], {
    queryParams: { returnUrl: state.url },
  });
};
