import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DashboardStatsComponent } from './dashboard-stats.component';
describe('Statistiques de l’inventaire', () => {
  it('compte les articles, distingue dates proches et dépassées et ouvre les bons filtres', () => {
    TestBed.configureTestingModule({ imports: [DashboardStatsComponent], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(DashboardStatsComponent);
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const date = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
    fixture.componentRef.setInput('products', [{ quantity: 3, expiryDate: '2000-01-01' }, { quantity: 2, expiryDate: date }, { quantity: 5, expiryDate: '2099-01-01' }]);
    fixture.componentRef.setInput('storageCount', 2); fixture.detectChanges();
    expect(fixture.componentInstance.counts()).toEqual({ all: 10, soon: 2, expired: 3 });
    expect(fixture.nativeElement.querySelector('a[href="/produits?etat=soon"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href="/stockages"]')).toBeTruthy();
    fixture.componentRef.setInput('products', []); fixture.detectChanges();
    expect(fixture.componentInstance.counts()).toEqual({ all: 0, soon: 0, expired: 0 });
    fixture.destroy();
  });
});
