import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';

export const guestGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Attend l'initialisation de la session Supabase.
  await firstValueFrom(
    toObservable(authService.isInitialized).pipe(
      filter((initialized) => initialized),
    ),
  );
  console.log('Guest guard:', {
    initialized: authService.isInitialized(),
    authenticated: authService.isAuthenticated(),
    user: authService.currentUser(),
  });
  // Un utilisateur connecté n'a pas accès aux pages d'authentification.
  if (authService.isAuthenticated()) {
    return router.createUrlTree(['/']);
  }

  return true;
};
