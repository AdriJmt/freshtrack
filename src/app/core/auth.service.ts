import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

import {
  AuthResponseDto,
  CsrfTokenResponseDto,
  RegisterRequestDto,
  RegisterResponseDto,
  VerifyEmailRequestDto,
  ResendCodeRequestDto,
  ResendCodeResponseDto,
  LoginRequestDto,
  VerificationLinkResponseDto,
} from './api/models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  private readonly accessTokenState = signal<string | null>(null);
  private readonly verificationStorageKey = 'freshtrack_verification_id';

  private readonly userState = signal<Pick<
    AuthResponseDto,
    'userId' | 'email' | 'displayName'
  > | null>(null);

  private readonly initializedState = signal(false);

  readonly accessToken = this.accessTokenState.asReadonly();
  readonly currentUser = this.userState.asReadonly();
  readonly isInitialized = this.initializedState.asReadonly();

  readonly isAuthenticated = computed(() => this.accessTokenState() !== null);

  private csrfToken: string | null = null;

  updateProfile(profile: Pick<AuthResponseDto, 'userId' | 'email' | 'displayName'>): void {
    this.userState.set(profile);
  }

  /**
   * Initialise l'authentification en essayant de récupérer
   * un nouvel access token à partir du cookie HttpOnly.
   */
  async initialize(): Promise<void> {
    if (this.initializedState()) {
      return;
    }

    try {
      await this.refreshAccessToken();
    } catch {
      this.clearAuthentication();
    } finally {
      this.initializedState.set(true);
    }
  }

  /**
   * Inscrit un nouvel utilisateur et récupère l'identifiant
   * de sa demande de vérification.
   */
  async register(request: RegisterRequestDto): Promise<string> {
    const response = await firstValueFrom(
      this.http.post<RegisterResponseDto>(`${this.apiUrl}/register`, request),
    );

    if (!response.verificationId) {
      throw new Error('Identifiant de vérification manquant.');
    }

    this.setVerificationId(response.verificationId);

    return response.verificationId;
  }

  /**
   * Vérifie l'adresse e-mail avec le code reçu.
   */
  async verifyEmail(request: VerifyEmailRequestDto): Promise<void> {
    await firstValueFrom(
      this.http.post<void>(`${this.apiUrl}/verify-email`, request),
    );

    this.clearVerificationId();
  }

  /**
   * Demande un nouveau code de vérification.
   */
  async resendCode(request: ResendCodeRequestDto): Promise<string> {
    const response = await firstValueFrom(
      this.http.post<ResendCodeResponseDto>(
        `${this.apiUrl}/resend-code`,
        request,
      ),
    );

    if (!response.verificationId) {
      throw new Error('Identifiant de vérification manquant.');
    }

    this.setVerificationId(response.verificationId);

    return response.verificationId;
  }

  /**
   * Récupère l'identifiant associé au lien de récupération.
   */
  async getVerificationLink(
    token: string,
  ): Promise<VerificationLinkResponseDto> {
    return firstValueFrom(
      this.http.get<VerificationLinkResponseDto>(
        `${this.apiUrl}/verification-link`,
        {
          params: { token },
        },
      ),
    );
  }

  /**
   * Stocke l'identifiant de vérification pour la session courante.
   */
  setVerificationId(verificationId: string): void {
    sessionStorage.setItem(this.verificationStorageKey, verificationId);
  }

  /**
   * Récupère l'identifiant de vérification de la session courante.
   */
  getVerificationId(): string | null {
    return sessionStorage.getItem(this.verificationStorageKey);
  }

  /**
   * Supprime l'identifiant de vérification.
   */
  clearVerificationId(): void {
    sessionStorage.removeItem(this.verificationStorageKey);
  }

  /**
   * Connecte un utilisateur.
   * Le refresh token est automatiquement stocké
   * dans le cookie HttpOnly par le navigateur.
   */
  async login(
    email: string,
    password: string,
  ): Promise<Pick<AuthResponseDto, 'userId' | 'email' | 'displayName'>> {
    const request: LoginRequestDto = {
      email,
      password,
    };

    const response = await firstValueFrom(
      this.http.post<AuthResponseDto>(`${this.apiUrl}/login`, request, {
        withCredentials: true,
      }),
    );

    this.updateAuthentication(response);

    return this.userState()!;
  }

  /**
   * Renouvelle l'access token à partir du refresh token.
   */
  async refreshAccessToken(): Promise<void> {
    const csrfToken = await this.getCsrfToken();

    const headers = new HttpHeaders({
      'X-XSRF-TOKEN': csrfToken,
    });

    const response = await firstValueFrom(
      this.http.post<AuthResponseDto>(
        `${this.apiUrl}/refresh`,
        {},
        {
          headers,
          withCredentials: true,
        },
      ),
    );

    this.updateAuthentication(response);
  }

  /**
   * Déconnecte l'utilisateur et révoque son refresh token.
   */
  async logout(): Promise<void> {
    try {
      const csrfToken = await this.getCsrfToken();

      const headers = new HttpHeaders({
        'X-XSRF-TOKEN': csrfToken,
      });

      await firstValueFrom(
        this.http.post<void>(
          `${this.apiUrl}/logout`,
          {},
          {
            headers,
            withCredentials: true,
          },
        ),
      );
    } finally {
      this.clearAuthentication();
    }
  }

  /**
   * Récupère un token CSRF auprès du backend.
   */
  private async getCsrfToken(): Promise<string> {
    const response = await firstValueFrom(
      this.http.get<CsrfTokenResponseDto>(`${this.apiUrl}/csrf`, {
        withCredentials: true,
      }),
    );

    if (!response.token) {
      throw new Error('Le serveur n’a pas retourné de token CSRF.');
    }

    this.csrfToken = response.token;

    return response.token;
  }

  /**
   * Met à jour les informations d'authentification.
   */
  private updateAuthentication(response: AuthResponseDto): void {
    if (!response.accessToken) {
      throw new Error('La réponse du serveur ne contient pas d’access token.');
    }

    this.accessTokenState.set(response.accessToken);

    this.userState.set({
      userId: response.userId,
      email: response.email,
      displayName: response.displayName,
    });
  }

  /**
   * Supprime l'état d'authentification local.
   */
  private clearAuthentication(): void {
    this.accessTokenState.set(null);
    this.userState.set(null);
    this.csrfToken = null;
  }
}
