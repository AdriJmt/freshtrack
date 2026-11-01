import { Component, input, output, signal, inject } from '@angular/core';

import { Storage } from '../../../../core/models/storage.model';
import { ProductService } from '../../../../core/services/product.service';

import {
  ManualProductFormComponent,
  ManualProductSubmission,
} from '../manual-product-form/manual-product-form.component';

export type ProductAddMode = 'manual' | 'scan';

@Component({
  selector: 'app-product-add-modal',
  imports: [ManualProductFormComponent],
  templateUrl: './product-add-modal.component.html',
  styleUrl: './product-add-modal.component.scss',
})
export class ProductAddModalComponent {
  private readonly productService = inject(ProductService);

  readonly storages = input.required<Storage[]>();

  readonly cancel = output<void>();
  readonly productsAdded = output<void>();

  readonly currentMode = signal<ProductAddMode | null>(null);
  readonly isSaving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  onSelectMode(mode: ProductAddMode): void {
    this.currentMode.set(mode);
    this.errorMessage.set(null);
  }

  backToModes(): void {
    if (this.isSaving()) {
      return;
    }

    this.currentMode.set(null);
    this.errorMessage.set(null);
  }

  async onSave(data: ManualProductSubmission): Promise<void> {
    if (this.isSaving()) {
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    try {
      await this.productService.createMany(data.storage_id, data.products);

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
