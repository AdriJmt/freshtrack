import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ProductsComponent } from './products.component';
import { ProductService } from '../../../../core/services/product.service';
import { InventoryStore } from '../../../inventory/services/inventory-store.service';

describe('Navigation dans le contenu d’un stockage', () => {
  it('applique le stockage de l’URL, recherche un code-barres et garde la modification ouverte en cas d’erreur', async () => {
    const inventory = { products: signal([{ id: 'p1', storageId: 'fridge', name: 'Yaourt', barcode: '12345678', expiryDate: '2099-01-01', quantity: 2 },
      { id: 'p2', storageId: 'pantry', name: 'Pâtes', barcode: '', expiryDate: '2099-01-01', quantity: 3 }]), storages: signal([{ id: 'fridge', name: 'Cuisine' }]), load: jasmine.createSpy('load').and.resolveTo() };
    const api = { updateProduct: jasmine.createSpy('update').and.returnValue(throwError(() => new Error('offline'))) };
    TestBed.configureTestingModule({ imports: [ProductsComponent], providers: [provideRouter([]),
      { provide: ActivatedRoute, useValue: { queryParamMap: of(convertToParamMap({ stockage: 'fridge' })) } },
      { provide: InventoryStore, useValue: inventory }, { provide: ProductService, useValue: api }] });
    TestBed.overrideComponent(ProductsComponent, { set: { template: '', imports: [] } });
    const fixture = TestBed.createComponent(ProductsComponent); fixture.detectChanges();
    const page = fixture.componentInstance;
    expect(page.filtered().map(product => product.id)).toEqual(['p1']); expect(page.quantity()).toBe(2);
    page.search.set('12345678'); expect(page.filtered().length).toBe(1);
    page.search.set('Pâtes'); expect(page.filtered()).toEqual([]);
    page.open(inventory.products()[0], 'edit');
    await page.save({ storageId: 'fridge', products: [{ name: 'Yaourt corrigé', quantity: 4 }] });
    expect(page.mode()).toBe('edit'); expect(page.error()).toContain('réessayez');
    expect(inventory.products()[0].name).toBe('Yaourt'); expect(page.busy()).toBeFalse();
    fixture.destroy();
  });
});
