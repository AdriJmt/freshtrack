import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AccountComponent } from './account.component';
import { AccountService } from '../../../../core/services/account.service';
import { AuthService } from '../../../../core/auth.service';
describe('Gestion du compte', () => {
  it('conserve le profil sur échec et redirige après un changement de mot de passe réussi', async () => {
    const api = { get: jasmine.createSpy().and.resolveTo({ email: 'test@example.invalid', displayName: 'Camille' }),
      update: jasmine.createSpy().and.rejectWith(new Error('offline')), changePassword: jasmine.createSpy().and.rejectWith(new HttpErrorResponse({ status: 400 })) };
    const auth = { logout: jasmine.createSpy().and.resolveTo() };
    TestBed.configureTestingModule({ imports: [AccountComponent], providers: [provideRouter([]), { provide: AccountService, useValue: api }, { provide: AuthService, useValue: auth }] });
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    const fixture = TestBed.createComponent(AccountComponent); const page = fixture.componentInstance;
    await page.load(); expect(page.displayName).toBe('Camille');
    page.displayName = 'Camille modifié'; await page.saveProfile();
    expect(page.profileError()).toBeTruthy(); expect(page.account()?.displayName).toBe('Camille');
    page.currentPassword = 'old-password'; page.newPassword = page.confirmation = 'new-password';
    await page.changePassword(); expect(page.passwordError()).toContain('actuel'); expect(auth.logout).not.toHaveBeenCalled();
    api.changePassword.and.resolveTo(); await page.changePassword();
    expect(auth.logout).toHaveBeenCalledTimes(1); expect(navigate).toHaveBeenCalledWith(['/connexion'], { queryParams: { passwordUpdated: true } });
    fixture.destroy();
  });
});
