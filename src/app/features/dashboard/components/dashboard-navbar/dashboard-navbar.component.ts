import { Component, HostListener, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { BrandLogoComponent } from '../../../../shared/ui/brand-logo/brand-logo.component';
import { AuthService } from '../../../../core/auth.service';

@Component({
  selector: 'app-dashboard-navbar',
  imports: [RouterLink, RouterLinkActive, BrandLogoComponent],
  templateUrl: './dashboard-navbar.component.html',
  styleUrl: './dashboard-navbar.component.scss',
})
export class DashboardNavbarComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isProfileMenuOpen = signal(false);
  readonly isLoggingOut = signal(false);
  readonly logoutError = signal('');

  toggleProfileMenu(): void {
    this.isProfileMenuOpen.update((isOpen) => !isOpen);
    this.logoutError.set('');
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target;

    if (
      target instanceof Element &&
      !target.closest('.dashboard-navbar__account')
    ) {
      this.isProfileMenuOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.isProfileMenuOpen.set(false);
  }

  async logout(): Promise<void> {
    if (this.isLoggingOut()) {
      return;
    }

    this.isLoggingOut.set(true);
    this.logoutError.set('');

    try {
      await this.authService.logout();
      this.isProfileMenuOpen.set(false);
      await this.router.navigate(['/connexion']);
    } catch {
      this.logoutError.set('Impossible de vous déconnecter. Réessayez.');
    } finally {
      this.isLoggingOut.set(false);
    }
  }
}
