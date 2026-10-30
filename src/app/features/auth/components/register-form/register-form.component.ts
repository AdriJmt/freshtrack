import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../../core/auth.service';
import { BrandLogoComponent } from '../../../../shared/ui/brand-logo/brand-logo.component';
import { PasswordFieldComponent } from '../../../../shared/ui/password-field/password-field.component';
import { AuthError } from '@supabase/supabase-js';

@Component({
  selector: 'app-register-form',
  imports: [
    FormsModule,
    RouterLink,
    BrandLogoComponent,
    PasswordFieldComponent,
  ],
  templateUrl: './register-form.component.html',
  styleUrl: './register-form.component.scss',
})
export class RegisterFormComponent {
  email = '';
  password = '';
  confirmPassword = '';

  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  constructor(private readonly authService: AuthService) {}

  async onSubmit(): Promise<void> {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas.';
      return;
    }

    this.isSubmitting = true;

    try {
      await this.authService.register(this.email, this.password);

      this.successMessage =
        'Votre inscription a été prise en compte. Vérifiez votre boîte mail si une confirmation est nécessaire.';
    } catch (error: unknown) {
      if (error instanceof AuthError && error.code === 'weak_password') {
        this.errorMessage =
          'Le mot de passe doit posséder au moins 6 caractères.';
      } else {
        this.errorMessage =
          'Impossible de créer votre compte. Vérifiez vos informations ou réessayez.';
      }
    } finally {
      this.isSubmitting = false;
    }
  }
}
