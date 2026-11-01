import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { RegisterRequestDto } from '../../../../core/api/models';
import { AuthService } from '../../../../core/auth.service';
import { BrandLogoComponent } from '../../../../shared/ui/brand-logo/brand-logo.component';
import { PasswordFieldComponent } from '../../../../shared/ui/password-field/password-field.component';
import { HttpErrorResponse } from '@angular/common/http';

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
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  confirmPassword = '';

  isSubmitting = false;
  errorMessage = '';

  async onSubmit(): Promise<void> {
    this.errorMessage = '';

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas.';
      return;
    }

    this.isSubmitting = true;

    try {
      const request: RegisterRequestDto = {
        email: this.email,
        password: this.password,
      };

      await this.authService.register(request);

      await this.router.navigate(['/confirmation-inscription']);
    } catch (error: unknown) {
      if (error instanceof HttpErrorResponse) {
        this.errorMessage = error.error?.detail ?? 'Une erreur est survenue.';
      } else {
        this.errorMessage = 'Une erreur inattendue est survenue.';
      }
    } finally {
      this.isSubmitting = false;
    }
  }
}
