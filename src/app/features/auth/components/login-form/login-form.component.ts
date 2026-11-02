import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthError } from '@supabase/supabase-js';

import { AuthService } from '../../../../core/auth.service';
import { PasswordFieldComponent } from '../../../../shared/ui/password-field/password-field.component';

@Component({
  selector: 'app-login-form',
  imports: [FormsModule, PasswordFieldComponent, RouterLink],
  templateUrl: './login-form.component.html',
  styleUrl: './login-form.component.scss',
})
export class LoginFormComponent {
  email = '';
  password = '';

  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {
    if (this.route.snapshot.queryParamMap.get('passwordUpdated'))
      this.successMessage =
        'Votre mot de passe a été modifié. Connectez-vous avec le nouveau.';
  }

  async onSubmit(): Promise<void> {
    if (this.isSubmitting) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.isSubmitting = true;

    try {
      await this.authService.login(this.email, this.password);
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
      await this.router.navigateByUrl(
        returnUrl?.startsWith('/') && !returnUrl.startsWith('//')
          ? returnUrl
          : '/',
      );
    } catch (error: unknown) {
      if (error instanceof AuthError && error.code === 'invalid_credentials') {
        this.errorMessage = 'Vérifiez vos identifiants et réessayez.';
      } else if (
        error instanceof AuthError &&
        error.code === 'email_not_confirmed'
      ) {
        this.errorMessage =
          "Votre adresse e-mail n'est pas confirmée. Vérifiez votre boîte de réception.";
      } else {
        this.errorMessage =
          'Impossible de vous connecter. Vérifiez vos informations ou réessayez.';
      }
    } finally {
      this.isSubmitting = false;
    }
  }
}
