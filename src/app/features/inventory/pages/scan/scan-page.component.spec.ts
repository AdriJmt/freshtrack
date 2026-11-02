import { TestBed, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { ScanPageComponent } from './scan-page.component';
import { ScanSessionService } from '../../../../core/services/scan-session.service';
import { StorageService } from '../../../../core/services/storage.service';
import { AuthService } from '../../../../core/auth.service';
import { ScanFeedbackService } from '../../services/scan-feedback.service';

describe('Fin de session mobile', () => {
  let storages: jasmine.Spy, status: jasmine.Spy;
  beforeEach(async () => {
    storages = jasmine.createSpy('storages').and.returnValue(of([{ id: 'fridge', name: 'Frigo' }]));
    status = jasmine.createSpy('status').and.returnValue(of({ connected: true, addedProducts: 0 }));
    await TestBed.configureTestingModule({ imports: [ScanPageComponent], providers: [
      { provide: ActivatedRoute, useValue: { snapshot: { fragment: 'token=temporary-token' } } },
      { provide: Router, useValue: { navigate: jasmine.createSpy('navigate').and.resolveTo(true) } },
      { provide: ScanSessionService, useValue: { storages, mobileStatus: status } },
      { provide: StorageService, useValue: {} }, { provide: AuthService, useValue: {} },
      { provide: ScanFeedbackService, useValue: { enable: () => Promise.resolve() } },
    ] }).overrideComponent(ScanPageComponent, { set: { template: '', imports: [] } }).compileComponents();
  });
  it('affiche l’état expiré si le QR code n’est plus valide à l’ouverture', async () => {
    storages.and.returnValue(throwError(() => new HttpErrorResponse({ status: 410 })));
    const fixture = TestBed.createComponent(ScanPageComponent);
    await fixture.componentInstance.load();
    expect(fixture.componentInstance.state()).toBe('expired'); expect(fixture.componentInstance.loading()).toBeFalse();
    fixture.destroy();
  });
  it('distingue une panne réseau d’une expiration', async () => {
    storages.and.returnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    const fixture = TestBed.createComponent(ScanPageComponent);
    await fixture.componentInstance.load();
    expect(fixture.componentInstance.state()).toBeNull(); expect(fixture.componentInstance.error()).toContain('connexion');
    fixture.destroy();
  });
  it('interrompt le parcours si la session est fermée pendant le scan', fakeAsync(() => {
    const fixture = TestBed.createComponent(ScanPageComponent), page = fixture.componentInstance;
    void page.load(); flushMicrotasks(); tick(0);
    status.and.returnValue(throwError(() => new HttpErrorResponse({ status: 410 })));
    tick(15000);
    expect(page.state()).toBe('expired');
    fixture.destroy();
  }));
  it('arrête la surveillance lorsque l’utilisateur termine le scan', fakeAsync(() => {
    const fixture = TestBed.createComponent(ScanPageComponent), page = fixture.componentInstance;
    void page.load(); flushMicrotasks(); tick(0); page.close(); tick(30000);
    expect(page.state()).toBe('finished'); expect(status).toHaveBeenCalledTimes(1);
    fixture.destroy();
  }));
});
