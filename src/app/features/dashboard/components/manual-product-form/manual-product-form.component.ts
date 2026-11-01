import { Component, input, output, signal, OnInit } from '@angular/core';

import { Storage } from '../../../../core/models/storage.model';
import { CreateProduct } from '../../../../core/models/product.model';

export interface ManualProductEntry {
  id: number;
  name: string;
  barcode: string;
  expiry_date: string;
  expiry_type: 'DLC' | 'DDM';
  package_size: number | null;
  package_unit: string;
}

export interface ManualProductSubmission {
  storage_id: string;
  products: CreateProduct[];
}

@Component({
  selector: 'app-manual-product-form',
  imports: [],
  templateUrl: './manual-product-form.component.html',
  styleUrl: './manual-product-form.component.scss',
})
export class ManualProductFormComponent implements OnInit {
  readonly storages = input.required<Storage[]>();

  readonly save = output<ManualProductSubmission>();
  readonly cancel = output<void>();

  readonly selectedStorageId = signal('');

  readonly products = signal<ManualProductEntry[]>([
    this.createEmptyProduct(1),
  ]);

  private nextProductId = 2;

  ngOnInit(): void {
    const firstStorage = this.storages()[0];

    if (firstStorage) {
      this.selectedStorageId.set(firstStorage.id);
    }
  }

  addProduct(): void {
    this.products.update((products) => [
      ...products,
      this.createEmptyProduct(this.nextProductId++),
    ]);
  }

  removeProduct(id: number): void {
    this.products.update((products) =>
      products.filter((product) => product.id !== id),
    );
  }

  updateProduct(
    id: number,
    changes: Partial<Omit<ManualProductEntry, 'id'>>,
  ): void {
    this.products.update((products) =>
      products.map((product) =>
        product.id === id ? { ...product, ...changes } : product,
      ),
    );
  }

  isFormValid(): boolean {
    return (
      !!this.selectedStorageId() &&
      this.products().length > 0 &&
      this.products().every(
        (product) =>
          product.name.trim().length > 0 &&
          !!product.expiry_date &&
          (product.expiry_type === 'DLC' || product.expiry_type === 'DDM') &&
          (product.package_size === null ||
            (Number.isFinite(product.package_size) &&
              product.package_size >= 0)),
      )
    );
  }

  submit(): void {
    if (!this.isFormValid()) {
      return;
    }

    const products: CreateProduct[] = this.products().map((product) => ({
      name: product.name.trim(),
      barcode: product.barcode.trim() || null,
      expiry_date: product.expiry_date,
      expiry_type: product.expiry_type,
      package_size: product.package_size,
      package_unit: product.package_unit || null,
    }));

    this.save.emit({
      storage_id: this.selectedStorageId(),
      products,
    });
  }

  private createEmptyProduct(id: number): ManualProductEntry {
    return {
      id,
      name: '',
      barcode: '',
      expiry_date: '',
      expiry_type: 'DLC',
      package_size: null,
      package_unit: '',
    };
  }
}
