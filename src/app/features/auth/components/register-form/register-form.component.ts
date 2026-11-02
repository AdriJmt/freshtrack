import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../../core/auth.service';
import { BrandLogoComponent } from '../../../../shared/ui/brand-logo/brand-logo.component';
import { PasswordFieldComponent } from '../../../../shared/ui/password-field/password-field.component';
import { validPassword } from '../../../../shared/utils/password';
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
  displayName = '';
  email = '';
  password = '';
  confirmPassword = '';
  isSubmitting = false;
  errorMessage = '';
  readonly validPassword = validPassword;

  async onSubmit(): Promise<void> {
    if (this.isSubmitting) return;
    this.errorMessage = '';
    if (
      !this.email.trim() ||
      !validPassword(this.password) ||
      this.displayName.trim().length > 100
    ) {
      this.errorMessage =
        'Vérifiez votre adresse e-mail et choisissez un mot de passe de 8 à 72 caractères.';
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas.';
      return;
    }
    this.isSubmitting = true;
    try {
      await this.authService.register({
        email: this.email.trim(),
        displayName: this.displayName.trim() || undefined,
        password: this.password,
      });
      await this.router.navigate(['/confirmation-inscription']);
    } catch (error) {
      this.errorMessage =
        error instanceof HttpErrorResponse && error.status === 409
          ? 'Cette adresse e-mail est déjà utilisée. Connectez-vous ou choisissez une autre adresse.'
          : 'La création du compte a échoué. Vérifiez vos informations puis réessayez.';
    } finally {
      this.isSubmitting = false;
    }
  }
}
