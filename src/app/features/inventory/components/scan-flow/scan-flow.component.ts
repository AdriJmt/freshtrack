import { HttpErrorResponse } from '@angular/common/http';
import { ProductImageComponent } from '../../../../shared/ui/product-image/product-image.component';
import { SelectComponent } from '../../../../shared/ui/select/select.component';
import { storageSelectOptions } from '../../../../shared/ui/select/select-options';
import { computed, Component, OnDestroy, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom, Subject, takeUntil, timeout } from 'rxjs';
import { StorageDto } from '../../../../core/api/models';
import { ScanSessionService } from '../../../../core/services/scan-session.service';
import { ProductService } from '../../../../core/services/product.service';
import { CameraScannerComponent } from '../camera-scanner/camera-scanner.component';

import { ScanStep } from '../../types/scan-step.type';
export { parseExpiryDate } from '../../utils/expiry-date';
import { ExpiryDateReaderComponent } from '../expiry-date-reader/expiry-date-reader.component';

@Component({
  selector: 'app-scan-flow',
  imports: [ProductImageComponent, SelectComponent, FormsModule, CameraScannerComponent, ExpiryDateReaderComponent],
  templateUrl: './scan-flow.component.html',
  styleUrl: './scan-flow.component.scss',
})
export class ScanFlowComponent implements OnDestroy {
  private readonly service = inject(ProductService);
  private readonly sessions = inject(ScanSessionService);
  readonly initialStorageId = input('');
  readonly showHeader = input(true);
  readonly scanToken = input('');
  readonly storageOptions = computed(() => storageSelectOptions(this.storages()));
  readonly storages = input.required<StorageDto[]>();
  readonly sessionExpired = output<void>();
  readonly errorMessage = signal('');
  readonly productsAdded = output<void>();
  readonly cancel = output<void>();
  readonly step = signal<ScanStep>('barcode');
  readonly busy = signal(false);
  readonly message = signal('');
  imageUrl: string | undefined;
  name = ''; barcode = ''; expiryDate = ''; quantity = 1; storageId = '';
  private destroyed = false;
  private lookupGeneration = 0;
  private readonly lookupCancelled = new Subject<void>();

  detected(barcode: string): void {
    if (this.busy() || this.step() !== 'barcode') return;
    this.barcode = barcode.trim();
    this.message.set('Comparez les chiffres avec ceux imprimés sous le code-barres.');
    this.step.set('confirm-barcode');
  }

  canConfirmBarcode(): boolean { return /^\d{8,14}$/.test(this.barcode.trim()); }

  async confirmBarcode(): Promise<void> {
    if (this.busy() || this.step() !== 'confirm-barcode' || !this.canConfirmBarcode()) return;
    const generation = ++this.lookupGeneration;
    const barcode = this.barcode.trim();
    this.barcode = barcode;
    this.imageUrl = undefined;
    this.step.set('lookup');
    this.busy.set(true);
    this.message.set('Recherche du produit…');
    const feedbackUntil = Date.now() + 600;
    this.storageId ||= this.initialStorageId() || this.storages()[0]?.id || '';
    try {
      const product = await firstValueFrom(this.service.lookupByBarcode(barcode).pipe(takeUntil(this.lookupCancelled), timeout(8000)));
      if (this.destroyed || generation !== this.lookupGeneration) return;
      this.name = product.name ?? '';
      this.imageUrl = product.imageUrl;
      this.quantity = product.quantity ?? 1;
      this.message.set(this.name ? 'Produit trouvé. Scannez maintenant la date de péremption.' : 'Produit inconnu : complétez les informations.');
    } catch {
      if (this.destroyed || generation !== this.lookupGeneration) return;
      this.message.set('Recherche indisponible ou produit inconnu. Vous pouvez compléter les champs.');
    } finally {
      if (this.destroyed || generation !== this.lookupGeneration) return;
      await new Promise(resolve => setTimeout(resolve, Math.max(0, feedbackUntil - Date.now())));
      if (!this.destroyed && generation === this.lookupGeneration) { this.busy.set(false); this.step.set('date'); }
    }
  }

  onDateDetected(date: string): void {
    if (this.destroyed || this.step() !== 'date') return;
    this.expiryDate = date;
    this.message.set('Vérifiez les informations avant de ranger le produit.');
    this.step.set('review');
  }

  valid(): boolean {
    return !!this.name.trim() && /^\d{4}-\d{2}-\d{2}$/.test(this.expiryDate) &&
      Number.isFinite(new Date(this.expiryDate).getTime()) &&
      Number.isInteger(this.quantity) && this.quantity >= 1 && this.quantity <= 2147483647 && this.storages().some(s => s.id === this.storageId);
  }

  async save(): Promise<void> {
    if (this.busy() || !this.valid()) return;
    this.busy.set(true);
    this.errorMessage.set('');
    this.message.set('Enregistrement du produit…');
    try {
      const product = {
        name: this.name.trim(), barcode: this.barcode.trim() || undefined, expiryDate: this.expiryDate,
        quantity: this.quantity,
      };
      await firstValueFrom(this.scanToken()
        ? this.sessions.add(this.scanToken(), this.storageId, product)
        : this.service.createProducts(this.storageId, [product]));
      this.message.set('');
      this.step.set('success');
      this.productsAdded.emit();
    } catch (error) {
      this.message.set('');
      if (error instanceof HttpErrorResponse && error.status === 410 && this.scanToken()) {
        this.errorMessage.set('Cette session a expiré. Générez un nouveau QR code sur l’ordinateur.');
        this.sessionExpired.emit();
      } else if (error instanceof HttpErrorResponse && error.status === 400) {
        this.errorMessage.set('Vérifiez les informations du produit, notamment son nom et sa date de péremption.');
      } else if (error instanceof HttpErrorResponse && error.status === 403) {
        this.errorMessage.set('Ce stockage n’est pas accessible. Choisissez un autre stockage ou relancez le scan.');
      } else if (error instanceof HttpErrorResponse && error.status === 401) {
        this.errorMessage.set('Votre connexion a expiré. Reconnectez-vous pour enregistrer le produit.');
      } else {
        this.errorMessage.set('Enregistrement impossible. Vos informations sont conservées : vérifiez votre connexion puis réessayez.');
      }
    }
    finally { this.busy.set(false); }
  }

  rescanBarcode(): void {
    if (this.busy() && this.step() === 'review') return;
    this.lookupGeneration++;
    this.lookupCancelled.next();
    this.busy.set(false);
    this.imageUrl = undefined;
    this.name = ''; this.barcode = ''; this.expiryDate = ''; this.quantity = 1;
    this.errorMessage.set('');
    this.message.set(''); this.step.set('barcode');
  }

  backToDate(): void { if (!this.busy()) { this.errorMessage.set(''); this.message.set(''); this.step.set('date'); } }
  next(): void { this.rescanBarcode(); }
  ngOnDestroy(): void {
    this.destroyed = true; this.lookupGeneration++;
    this.lookupCancelled.next(); this.lookupCancelled.complete();
  }
}
