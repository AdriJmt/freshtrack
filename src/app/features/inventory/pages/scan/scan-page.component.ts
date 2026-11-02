import { HttpErrorResponse } from '@angular/common/http';
import { ScanSessionStateComponent } from '../../components/scan-session-state/scan-session-state.component';
import { ScanSessionState } from '../../types/scan-session-state.type';
import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, Subscription, catchError, exhaustMap, firstValueFrom, timer } from 'rxjs';
import { AuthService } from '../../../../core/auth.service';
import { ScanSessionService } from '../../../../core/services/scan-session.service';
import { StorageService } from '../../../../core/services/storage.service';
import { StorageDto } from '../../../../core/api/models';
import { ScanFeedbackService } from '../../services/scan-feedback.service';
import { ScanFlowComponent } from '../../components/scan-flow/scan-flow.component';
@Component({
  selector: 'app-scan-page', imports: [ScanFlowComponent, ScanSessionStateComponent],
  templateUrl: './scan-page.component.html',
  styleUrl: './scan-page.component.scss',
})
export class ScanPageComponent implements OnInit, OnDestroy {
  private readonly feedback = inject(ScanFeedbackService);
  private readonly auth = inject(AuthService);
  private readonly sessions = inject(ScanSessionService);
  readonly scanToken = new URLSearchParams(inject(ActivatedRoute).snapshot.fragment ?? '').get('token') ?? '';
  readonly state = signal<ScanSessionState | null>(null);
  private sessionCheck?: Subscription;
  private readonly service = inject(StorageService);
  private readonly router = inject(Router);
  readonly storages = signal<StorageDto[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  ngOnInit(): void { void this.feedback.enable(); void this.load(); }
  async load(): Promise<void> {
    this.sessionCheck?.unsubscribe();
    this.state.set(null);
    this.loading.set(true); this.error.set('');
    try {
      if (this.scanToken) {
        this.storages.set(await firstValueFrom(this.sessions.storages(this.scanToken)));
        this.watchSession();
      } else {
        await this.auth.initialize();
        if (!this.auth.isAuthenticated()) {
          await this.router.navigate(['/connexion'], { queryParams: { returnUrl: '/scan' } });
          return;
        }
        this.storages.set(await firstValueFrom(this.service.getAllStorages()));
      }
    }
    catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 410 && this.scanToken) this.onSessionExpired();
      else this.error.set('Impossible de joindre le serveur. Vérifiez la connexion puis réessayez.');
    }
    finally { this.loading.set(false); }
  }
  close(): void {
    if (this.scanToken) { this.sessionCheck?.unsubscribe(); this.state.set('finished'); }
    else void this.router.navigate(['/produits']);
  }
  onSessionExpired(): void {
    if (this.state() === 'finished') return;
    this.sessionCheck?.unsubscribe();
    this.state.set('expired');
  }

  private watchSession(): void {
    this.sessionCheck = timer(0, 15000).pipe(
      exhaustMap(() => this.sessions.mobileStatus(this.scanToken).pipe(
        catchError(error => {
          if (error instanceof HttpErrorResponse && error.status === 410) this.onSessionExpired();
          return EMPTY;
        }),
      )),
    ).subscribe();
  }
  ngOnDestroy(): void { this.sessionCheck?.unsubscribe(); }

}
