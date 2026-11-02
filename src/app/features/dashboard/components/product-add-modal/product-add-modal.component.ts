import { ManualProductSubmission } from '../../../inventory/types/product-form';
import { ModalComponent } from '../../../../shared/ui/modal/modal.component';
import { Component, inject, input, output, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { StorageDto } from '../../../../core/api/models';
import { ProductService } from '../../../../core/services/product.service';

import { ManualProductFormComponent } from '../manual-product-form/manual-product-form.component';

import { ScanFeedbackService } from '../../../inventory/services/scan-feedback.service';
import { ScanFlowComponent } from '../../../inventory/components/scan-flow/scan-flow.component';
import { QrScanPanelComponent } from '../qr-scan-panel/qr-scan-panel.component';

export type ProductAddMode = 'manual' | 'scan';

@Component({
  selector: 'app-product-add-modal',
  imports: [
    ModalComponent,
    ManualProductFormComponent,
    ScanFlowComponent,
    QrScanPanelComponent,
  ],
  templateUrl: './product-add-modal.component.html',
  styleUrl: './product-add-modal.component.scss',
})
export class ProductAddModalComponent {
  private readonly feedback = inject(ScanFeedbackService);
  private readonly productService = inject(ProductService);

  readonly useCamera = signal(
    navigator.maxTouchPoints > 0 ||
      /Android|iPhone|iPad/i.test(navigator.userAgent),
  );

  readonly initialStorageId = input('');
  readonly storages = input.required<StorageDto[]>();

  readonly cancel = output<void>();
  readonly productsAdded = output<void>();

  private scanHasAdded = false;

  onScannedProductAdded(): void {
    this.scanHasAdded = true;
  }

  closeScan(): void {
    if (this.scanHasAdded) this.productsAdded.emit();
    this.cancel.emit();
  }

  readonly currentMode = signal<ProductAddMode | null>(null);
  readonly isSaving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  startLocalScan(): void {
    void this.feedback.enable();
    this.useCamera.set(true);
  }

  onSelectMode(mode: ProductAddMode): void {
    if (mode === 'scan') void this.feedback.enable();
    this.currentMode.set(mode);
    this.errorMessage.set(null);
  }

  backToModes(): void {
    if (this.isSaving()) return;

    if (this.scanHasAdded) {
      this.productsAdded.emit();
      this.scanHasAdded = false;
    }
    this.currentMode.set(null);
    this.errorMessage.set(null);
  }

  async onSave(data: ManualProductSubmission): Promise<void> {
    if (this.isSaving()) return;

    this.isSaving.set(true);
    this.errorMessage.set(null);

    try {
      await firstValueFrom(
        this.productService.createProducts(data.storageId, data.products),
      );

      this.productsAdded.emit();
      this.cancel.emit();
    } catch (error) {
      console.error('Erreur lors de l’ajout des produits :', error);
      this.errorMessage.set('Impossible d’enregistrer les produits.');
    } finally {
      this.isSaving.set(false);
    }
  }
}
