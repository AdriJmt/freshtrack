import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { InventoryStore } from './inventory-store.service';
import { StorageService } from '../../../core/services/storage.service';
import { ProductService } from '../../../core/services/product.service';
import { StorageDto } from '../../../core/api/models';

describe('Données communes de l’inventaire', () => {
  function setup() {
    const storages = { getAllStorages: jasmine.createSpy().and.returnValue(of([{ id: 'fridge', name: 'Cuisine' }])) };
    const products = { getProductsFromStorage: jasmine.createSpy().and.returnValue(of([
      { id: 'p1', storageId: 'fridge', quantity: 3, expiryDate: '2000-01-01' },
      { id: 'p2', storageId: 'fridge', quantity: 2, expiryDate: '2099-01-01' },
    ])) };
    TestBed.configureTestingModule({ providers: [InventoryStore, { provide: StorageService, useValue: storages }, { provide: ProductService, useValue: products }] });
    return { store: TestBed.inject(InventoryStore), storages, products };
  }
  it('calcule quantités, références, alertes et aperçu à partir du même chargement', async () => {
    const { store } = setup(); await store.load();
    expect(store.summaries().get('fridge')).toEqual(jasmine.objectContaining({ quantity: 5, references: 2, urgent: 1 }));
    expect(store.storageNames().get('fridge')).toBe('Cuisine');
  });
  it('mutualise deux demandes simultanées', async () => {
    const { store, storages } = setup();
    const response = new Subject<StorageDto[]>(); storages.getAllStorages.and.returnValue(response);
    const first = store.load(), second = store.load();
    expect(first).toBe(second); response.next([]); response.complete(); await first;
    expect(storages.getAllStorages).toHaveBeenCalledTimes(1); expect(store.loading()).toBeFalse();
  });
  it('évite le clignotement au changement de page et force un rechargement après mutation', async () => {
    const { store, storages } = setup();
    await store.load(); await store.load();
    expect(storages.getAllStorages).toHaveBeenCalledTimes(1);
    await store.load(true); expect(storages.getAllStorages).toHaveBeenCalledTimes(2);
  });
  it('affiche une erreur de chargement puis permet de réessayer', async () => {
    const { store, storages } = setup(); storages.getAllStorages.and.returnValue(throwError(() => new Error('offline')));
    await store.load(); expect(store.error()).toContain('Impossible'); expect(store.loading()).toBeFalse();
    storages.getAllStorages.and.returnValue(of([])); await store.load(); expect(store.error()).toBe('');
  });
});
