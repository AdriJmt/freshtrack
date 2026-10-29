import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthError } from '@supabase/supabase-js';

import { AuthService } from '../../../../core/auth.service';
import { PasswordFieldComponent } from '../../../../shared/ui/password-field/password-field.component';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [FormsModule, PasswordFieldComponent, RouterLink],
  templateUrl: './login-form.component.html',
  styleUrl: './login-form.component.scss',
})
export class LoginFormComponent {
  email = '';
  password = '';
  rememberMe = false;

  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  async onSubmit(): Promise<void> {
    if (this.isSubmitting) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.isSubmitting = true;

    try {
      await this.authService.login(this.email, this.password, this.rememberMe);
      await this.router.navigate(['/']);
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
