import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AccountDto } from '../../../../core/api/models';
import { AccountService } from '../../../../core/services/account.service';
import { AuthService } from '../../../../core/auth.service';
import { PasswordFieldComponent } from '../../../../shared/ui/password-field/password-field.component';
import { ContentSkeletonComponent } from '../../../../shared/ui/content-skeleton/content-skeleton.component';
import { validPassword } from '../../../../shared/utils/password';
@Component({
  selector: 'app-account',
  imports: [
    FormsModule,
    RouterLink,
    PasswordFieldComponent,
    ContentSkeletonComponent,
  ],
  templateUrl: './account.component.html',
  styleUrl: './account.component.scss',
})
export class AccountComponent implements OnInit {
  private readonly api = inject(AccountService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly account = signal<AccountDto | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly changingPassword = signal(false);
  readonly loadError = signal('');
  readonly profileError = signal('');
  readonly passwordError = signal('');
  readonly saved = signal(false);
  displayName = '';
  currentPassword = '';
  newPassword = '';
  confirmation = '';
  readonly validPassword = validPassword;
  ngOnInit(): void {
    void this.load();
  }
  async load(): Promise<void> {
    this.loading.set(true);
    this.loadError.set('');
    try {
      const account = await this.api.get();
      this.account.set(account);
      this.displayName = account.displayName ?? '';
    } catch {
      this.loadError.set('Impossible de charger votre compte. Réessayez.');
    } finally {
      this.loading.set(false);
    }
  }
  async saveProfile(): Promise<void> {
    if (this.saving() || this.displayName.trim().length > 100) return;
    this.saving.set(true);
    this.saved.set(false);
    this.profileError.set('');
    try {
      this.account.set(await this.api.update(this.displayName.trim()));
      this.saved.set(true);
    } catch {
      this.profileError.set('Impossible d’enregistrer votre nom. Réessayez.');
    } finally {
      this.saving.set(false);
    }
  }
  async changePassword(): Promise<void> {
    if (
      this.changingPassword() ||
      !this.currentPassword ||
      !validPassword(this.newPassword) ||
      this.newPassword !== this.confirmation
    )
      return;
    this.changingPassword.set(true);
    this.passwordError.set('');
    try {
      await this.api.changePassword({
        currentPassword: this.currentPassword,
        newPassword: this.newPassword,
      });
      // Password changes revoke refresh sessions; return to login with an explicit success message.
      try {
        await this.auth.logout();
      } catch {
        /* Local authentication is cleared by logout even on network failure. */
      }
      await this.router.navigate(['/connexion'], {
        queryParams: { passwordUpdated: true },
      });
    } catch (error) {
      this.passwordError.set(
        error instanceof HttpErrorResponse && error.status === 400
          ? error.error?.detail ||
              'Vérifiez votre mot de passe actuel et choisissez un nouveau mot de passe différent.'
          : 'Impossible de modifier le mot de passe. Réessayez.',
      );
    } finally {
      this.changingPassword.set(false);
    }
  }
}
