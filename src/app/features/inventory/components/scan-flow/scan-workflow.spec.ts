import { HttpErrorResponse } from '@angular/common/http';
import { TestBed, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { NEVER, of, Subject, throwError } from 'rxjs';
import { ScanFlowComponent } from './scan-flow.component';
import { ProductService } from '../../../../core/services/product.service';
import { ScanSessionService } from '../../../../core/services/scan-session.service';

describe('Enchaînement du scan', () => {
  let lookup: jasmine.Spy;
  let add: jasmine.Spy;
  beforeEach(async () => {
    add = jasmine.createSpy('add').and.returnValue(of(undefined));
    lookup = jasmine.createSpy('lookup').and.returnValue(of({ name: 'Yaourt', barcode: '12345678' }));
    await TestBed.configureTestingModule({ imports: [ScanFlowComponent], providers: [
      { provide: ProductService, useValue: { lookupByBarcode: lookup } },
      { provide: ScanSessionService, useValue: { add } },
    ] }).overrideComponent(ScanFlowComponent, { set: { template: '', imports: [] } }).compileComponents();
  });
  it('enregistre dans le stockage choisi sans envoyer un code-barres vide', async () => {
    const fixture = TestBed.createComponent(ScanFlowComponent);
    fixture.componentRef.setInput('storages', [{ id: 'fridge', name: 'Frigo' }]);
    fixture.componentRef.setInput('scanToken', 'temporary-token');
    const scan = fixture.componentInstance;
    scan.step.set('review'); scan.name = 'Yaourt'; scan.barcode = ' '; scan.expiryDate = '2027-01-05'; scan.storageId = 'fridge';
    await scan.save();
    expect(add).toHaveBeenCalledWith('temporary-token', 'fridge', jasmine.objectContaining({ name: 'Yaourt', barcode: undefined, expiryDate: '2027-01-05', quantity: 1 }));
    expect(scan.step()).toBe('success'); expect(scan.errorMessage()).toBe('');
    fixture.destroy();
  });
  it('refuse les quantités nulles, négatives et fractionnaires puis enregistre le nombre choisi', async () => {
    const fixture = TestBed.createComponent(ScanFlowComponent);
    fixture.componentRef.setInput('storages', [{ id: 'fridge' }]);
    fixture.componentRef.setInput('scanToken', 'temporary-token');
    const scan = fixture.componentInstance;
    scan.name = 'Yaourt'; scan.expiryDate = '2027-01-05'; scan.storageId = 'fridge';
    for (const quantity of [0, -1, 1.5, NaN]) {
      scan.quantity = quantity; await scan.save();
    }
    expect(add).not.toHaveBeenCalled();
    scan.quantity = 3; await scan.save();
    expect(add).toHaveBeenCalledWith('temporary-token', 'fridge', jasmine.objectContaining({ quantity: 3 }));
    fixture.destroy();
  });
  it('conserve les informations et expose une erreur distincte si l’enregistrement échoue', async () => {
    add.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    const fixture = TestBed.createComponent(ScanFlowComponent);
    fixture.componentRef.setInput('storages', [{ id: 'fridge', name: 'Frigo' }]);
    fixture.componentRef.setInput('scanToken', 'temporary-token');
    const scan = fixture.componentInstance;
    scan.step.set('review'); scan.name = 'Yaourt'; scan.expiryDate = '2027-01-05'; scan.storageId = 'fridge';
    await scan.save();
    expect(scan.errorMessage()).toContain('Enregistrement impossible'); expect(scan.message()).toBe('');
    expect(scan.name).toBe('Yaourt'); expect(scan.step()).toBe('review'); expect(scan.busy()).toBeFalse();
    add.and.returnValue(of(undefined)); await scan.save();
    expect(scan.errorMessage()).toBe(''); expect(scan.step()).toBe('success');
    fixture.destroy();
  });
  it('signale une session expirée lors de la validation', async () => {
    add.and.returnValue(throwError(() => new HttpErrorResponse({ status: 410 })));
    const fixture = TestBed.createComponent(ScanFlowComponent);
    fixture.componentRef.setInput('storages', [{ id: 'fridge', name: 'Frigo' }]);
    fixture.componentRef.setInput('scanToken', 'expired-token');
    const scan = fixture.componentInstance, expired = jasmine.createSpy('expired');
    scan.sessionExpired.subscribe(expired);
    scan.step.set('review'); scan.name = 'Yaourt'; scan.expiryDate = '2027-01-05'; scan.storageId = 'fridge';
    await scan.save(); expect(expired).toHaveBeenCalledTimes(1); expect(scan.errorMessage()).toContain('expiré');
    fixture.destroy();
  });
  it('attend la confirmation et recherche le code corrigé par l’utilisateur', fakeAsync(() => {
    const fixture = TestBed.createComponent(ScanFlowComponent);
    fixture.componentRef.setInput('storages', [{ id: 'fridge', name: 'Frigo' }]);
    const scan = fixture.componentInstance;
    scan.detected('12345678');
    expect(scan.step()).toBe('confirm-barcode'); expect(lookup).not.toHaveBeenCalled();
    scan.barcode = '3017620422003';
    void scan.confirmBarcode(); flushMicrotasks(); tick(600); flushMicrotasks();
    expect(lookup).toHaveBeenCalledOnceWith('3017620422003');
    expect(scan.step()).toBe('date');
    fixture.destroy();
  }));
  it('annule une recherche en cours sans laisser une réponse tardive remplacer le nouveau scan', fakeAsync(() => {
    const response = new Subject<{ name: string }>();
    lookup.and.returnValue(response);
    const fixture = TestBed.createComponent(ScanFlowComponent);
    fixture.componentRef.setInput('storages', [{ id: 'fridge', name: 'Frigo' }]);
    const scan = fixture.componentInstance;
    scan.storageId = 'fridge'; scan.detected('12345678'); void scan.confirmBarcode();
    expect(scan.step()).toBe('lookup');
    scan.rescanBarcode(); response.next({ name: 'Mauvais produit' });
    flushMicrotasks(); tick(600); flushMicrotasks();
    expect(scan.step()).toBe('barcode'); expect(scan.name).toBe(''); expect(scan.busy()).toBeFalse();
    expect(scan.storageId).toBe('fridge');
    fixture.destroy();
  }));
  it('permet de revenir de la vérification au scan de la date puis du code-barres', fakeAsync(() => {
    const fixture = TestBed.createComponent(ScanFlowComponent);
    fixture.componentRef.setInput('storages', [{ id: 'fridge', name: 'Frigo' }]);
    const scan = fixture.componentInstance;
    scan.detected('12345678'); void scan.confirmBarcode(); flushMicrotasks(); tick(600); flushMicrotasks();
    scan.onDateDetected('2027-01-05'); expect(scan.step()).toBe('review');
    scan.backToDate(); expect(scan.step()).toBe('date'); expect(scan.name).toBe('Yaourt');
    scan.rescanBarcode(); expect(scan.step()).toBe('barcode'); expect(scan.barcode).toBe('');
    expect(scan.expiryDate).toBe(''); expect(scan.imageUrl).toBeUndefined();
    fixture.destroy();
  }));
  it('passe du code-barres à la date puis à la vérification', fakeAsync(() => {
    const fixture = TestBed.createComponent(ScanFlowComponent);
    fixture.componentRef.setInput('storages', [{ id: 'fridge', name: 'Frigo' }]);
    const scan = fixture.componentInstance;
    scan.detected('12345678'); void scan.confirmBarcode(); flushMicrotasks();
    expect(scan.step()).toBe('lookup');
    tick(600); flushMicrotasks();
    expect(scan.step()).toBe('date'); expect(scan.name).toBe('Yaourt');
    scan.onDateDetected('2027-01-05');
    expect(scan.step()).toBe('review'); expect(scan.valid()).toBeTrue();
    fixture.destroy();
  }));
  it('utilise exclusivement l’image renvoyée par le lookup et la vide pour le produit suivant', fakeAsync(() => {
    const imageUrl = 'https://images.openfoodfacts.org/product-front.jpg';
    lookup.and.returnValue(of({ name: 'Yaourt', barcode: '12345678', imageUrl }));
    const fixture = TestBed.createComponent(ScanFlowComponent);
    fixture.componentRef.setInput('storages', [{ id: 'fridge', name: 'Frigo' }]);
    const scan = fixture.componentInstance;
    scan.detected('12345678'); void scan.confirmBarcode(); flushMicrotasks(); tick(600); flushMicrotasks();
    expect(scan.imageUrl).toBe(imageUrl);
    scan.next(); expect(scan.imageUrl).toBeUndefined();
    fixture.destroy();
  }));
  it('ne reste pas bloqué si le serveur de recherche ne répond pas', fakeAsync(() => {
    lookup.and.returnValue(NEVER);
    const fixture = TestBed.createComponent(ScanFlowComponent);
    fixture.componentRef.setInput('storages', [{ id: 'fridge', name: 'Frigo' }]);
    const scan = fixture.componentInstance;
    scan.detected('12345678'); void scan.confirmBarcode();
    tick(8001); flushMicrotasks(); tick(); flushMicrotasks();
    expect(scan.step()).toBe('date'); expect(scan.busy()).toBeFalse();
    expect(scan.message()).toContain('indisponible');
    fixture.destroy();
  }));
});
