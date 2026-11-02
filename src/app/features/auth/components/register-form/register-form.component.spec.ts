import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { RegisterFormComponent } from './register-form.component';
import { AuthService } from '../../../../core/auth.service';
describe('Inscription guidée', () => {
  function setup() {
    const register = jasmine.createSpy('register').and.resolveTo('verification-id');
    TestBed.configureTestingModule({ imports: [RegisterFormComponent], providers: [provideRouter([]), { provide: AuthService, useValue: { register } }] });
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    const fixture = TestBed.createComponent(RegisterFormComponent); fixture.detectChanges();
    return { fixture, form: fixture.componentInstance, register, navigate };
  }
  it('bloque un mot de passe court et explique la validation', async () => {
    const { fixture, form, register } = setup(); form.email = 'test@example.invalid'; form.password = form.confirmPassword = 'court';
    await form.onSubmit(); expect(register).not.toHaveBeenCalled(); expect(form.errorMessage).toContain('8 à 72'); fixture.destroy();
  });
  it('envoie le nom et l’e-mail normalisés puis ouvre la vérification', async () => {
    const { fixture, form, register, navigate } = setup(); form.displayName = ' Camille '; form.email = ' test@example.invalid '; form.password = form.confirmPassword = 'secret-valide';
    await form.onSubmit();
    expect(register).toHaveBeenCalledOnceWith({ displayName: 'Camille', email: 'test@example.invalid', password: 'secret-valide' });
    expect(navigate).toHaveBeenCalledWith(['/confirmation-inscription']); fixture.destroy();
  });
  it('signale clairement une adresse déjà inscrite et autorise une nouvelle tentative', async () => {
    const { fixture, form, register } = setup(); register.and.rejectWith(new HttpErrorResponse({ status: 409 }));
    form.email = 'test@example.invalid'; form.password = form.confirmPassword = 'secret-valide';
    await form.onSubmit(); expect(form.errorMessage).toContain('déjà utilisée'); expect(form.isSubmitting).toBeFalse(); fixture.destroy();
  });
});
