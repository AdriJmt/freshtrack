import { Component, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import {
  ResendCodeRequestDto,
  VerifyEmailRequestDto,
} from '../../../../core/api/models';
import { AuthService } from '../../../../core/auth.service';
import { BrandLogoComponent } from '../../../../shared/ui/brand-logo/brand-logo.component';
import { OtpInputComponent } from '../../components/otp-input/otp-input.component';

@Component({
  selector: 'app-email-verification',
  imports: [RouterLink, BrandLogoComponent, OtpInputComponent],
  templateUrl: './email-verification.component.html',
  styleUrl: './email-verification.component.scss',
})
export class EmailVerificationComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private redirectTimeout?: ReturnType<typeof setTimeout>;

  readonly redirectDelay = 5;

  verificationId: string | null = null;
  code = '';

  isLoading = true;
  isSubmitting = false;
  isResending = false;
  isVerified = false;

  errorMessage = '';
  successMessage = '';

  @ViewChild(OtpInputComponent)
  private otpInput?: OtpInputComponent;

  ngOnInit(): void {
    void this.initializeVerification();
  }

  ngOnDestroy(): void {
    if (this.redirectTimeout) {
      clearTimeout(this.redirectTimeout);
    }
  }

  /**
   * Initialise la vérification.
   *
   * - Après inscription : récupération depuis sessionStorage.
   * - Depuis le lien e-mail : récupération du verificationId.
   */
  private async initializeVerification(): Promise<void> {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.verificationId = this.authService.getVerificationId();

      if (!this.verificationId) {
        await this.router.navigate(['/inscription']);
        return;
      }

      this.isLoading = false;
      return;
    }

    try {
      const response = await this.authService.getVerificationLink(token);

      if (!response.verificationId) {
        throw new Error('Identifiant de vérification manquant.');
      }

      this.verificationId = response.verificationId;

      this.authService.setVerificationId(response.verificationId);

      // Supprime le token de récupération de l'URL.
      await this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {},
        replaceUrl: true,
      });
    } catch {
      this.errorMessage = 'Ce lien de récupération est invalide ou a expiré.';
    } finally {
      this.isLoading = false;
    }
  }

  onCodeChange(code: string): void {
    this.code = code;
    this.errorMessage = '';
  }

  /**
   * Vérifie le code OTP.
   */
  async verifyEmail(): Promise<void> {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.verificationId || this.code.length !== 6) {
      this.errorMessage = 'Veuillez saisir le code à 6 chiffres.';
      return;
    }

    this.isSubmitting = true;

    try {
      const request: VerifyEmailRequestDto = {
        verificationId: this.verificationId,
        code: this.code,
      };

      await this.authService.verifyEmail(request);

      this.isVerified = true;
      this.verificationId = null;

      this.successMessage = 'Votre adresse e-mail a été confirmée avec succès.';

      this.startRedirectCountdown();
    } catch {
      this.errorMessage =
        'Le code est invalide ou expiré. Vérifiez votre saisie ou demandez un nouveau code.';

      this.code = '';
      this.otpInput?.reset();
    } finally {
      this.isSubmitting = false;
    }
  }

  /**
   * Lance la redirection automatique après validation.
   */
  private startRedirectCountdown(): void {
    this.redirectTimeout = setTimeout(() => {
      void this.router.navigate(['/connexion'], {
        queryParams: { verified: true },
      });
    }, this.redirectDelay * 1000);
  }

  /**
   * Demande un nouveau code.
   */
  async resendCode(): Promise<void> {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.verificationId) {
      this.errorMessage =
        'Impossible de retrouver votre demande de vérification.';
      return;
    }

    this.isResending = true;

    try {
      const request: ResendCodeRequestDto = {
        verificationId: this.verificationId,
      };

      const newVerificationId = await this.authService.resendCode(request);

      this.verificationId = newVerificationId;

      this.code = '';
      this.otpInput?.reset();

      this.successMessage =
        'Un nouveau code vient de vous être envoyé par e-mail.';
    } catch {
      this.errorMessage =
        'Impossible de renvoyer le code. Veuillez réessayer dans quelques instants.';
    } finally {
      this.isResending = false;
    }
  }
}
