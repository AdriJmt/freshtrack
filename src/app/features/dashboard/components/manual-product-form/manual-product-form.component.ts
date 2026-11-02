import {
  ManualProductEntry,
  ManualProductSubmission,
} from '../../../inventory/types/product-form';
import { SelectComponent } from '../../../../shared/ui/select/select.component';
import { storageSelectOptions } from '../../../../shared/ui/select/select-options';
import {
  computed,
  Component,
  input,
  output,
  signal,
  OnInit,
} from '@angular/core';

import { ProductDto, StorageDto } from '../../../../core/api/models';

@Component({
  selector: 'app-manual-product-form',
  imports: [SelectComponent],
  templateUrl: './manual-product-form.component.html',
  styleUrl: './manual-product-form.component.scss',
})
export class ManualProductFormComponent implements OnInit {
  readonly storageOptions = computed(() =>
    storageSelectOptions(this.storages()),
  );
  readonly initialStorageId = input('');
  readonly storages = input.required<StorageDto[]>();

  readonly initialProduct = input<ProductDto | null>(null);
  readonly saving = input(false);
  readonly save = output<ManualProductSubmission>();
  readonly cancel = output<void>();

  readonly selectedStorageId = signal('');

  readonly products = signal<ManualProductEntry[]>([
    this.createEmptyProduct(1),
  ]);

  private nextProductId = 2;

  ngOnInit(): void {
    const product = this.initialProduct();
    if (product) {
      this.selectedStorageId.set(product.storageId ?? '');
      this.products.set([
        {
          id: 1,
          name: product.name ?? '',
          barcode: product.barcode ?? '',
          expiryDate: product.expiryDate ?? '',
          quantity: product.quantity ?? 1,
        },
      ]);
      return;
    }
    const firstStorage = this.storages()[0];

    const preferred = this.storages().find(
      (storage) => storage.id === this.initialStorageId(),
    );
    if (preferred?.id || firstStorage?.id) {
      this.selectedStorageId.set(preferred?.id ?? firstStorage!.id!);
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
          !!product.expiryDate &&
          Number.isFinite(new Date(product.expiryDate).getTime()) &&
          Number.isInteger(product.quantity) &&
          product.quantity >= 1 &&
          product.quantity <= 2147483647,
      )
    );
  }

  submit(): void {
    if (this.saving() || !this.isFormValid()) {
      return;
    }

    const products: ProductDto[] = this.products().map((product) => ({
      name: product.name.trim(),
      barcode: product.barcode.trim() || undefined,
      expiryDate: product.expiryDate,
      quantity: product.quantity,
    }));

    this.save.emit({
      storageId: this.selectedStorageId(),
      products,
    });
  }

  private createEmptyProduct(id: number): ManualProductEntry {
    return {
      id,
      name: '',
      barcode: '',
      expiryDate: '',
      quantity: 1,
    };
  }
}
