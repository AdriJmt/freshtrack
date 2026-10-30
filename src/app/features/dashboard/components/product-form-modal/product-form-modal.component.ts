import { Component, OnInit, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CreateProduct, Product } from '../../../../core/models/product.model';
import { Storage } from '../../../../core/models/storage.model';

@Component({
  selector: 'app-product-form-modal',
  imports: [FormsModule],
  templateUrl: './product-form-modal.component.html',
  styleUrl: './product-form-modal.component.scss',
})
export class ProductFormModalComponent implements OnInit {
  readonly product = input<Product | null>(null);
  readonly storages = input.required<Storage[]>();
  readonly saving = input(false);
  readonly errorMessage = input<string | null>(null);

  readonly save = output<CreateProduct & { storage_id: string }>();
  readonly cancel = output<void>();

  readonly name = signal('');
  readonly barcode = signal('');
  readonly storageId = signal('');
  readonly expiryDate = signal('');
  readonly expiryType = signal<'DLC' | 'DDM'>('DLC');
  readonly packageSize = signal<number | null>(null);
  readonly packageUnit = signal('');

  ngOnInit(): void {
    const product = this.product();

    if (product) {
      this.name.set(product.name);
      this.barcode.set(product.barcode ?? '');
      this.storageId.set(product.storage_id);
      this.expiryDate.set(product.expiry_date);
      this.expiryType.set(product.expiry_type);
      this.packageSize.set(product.package_size);
      this.packageUnit.set(product.package_unit ?? '');
    } else {
      this.storageId.set(this.storages()[0]?.id ?? '');
    }
  }

  submit(): void {
    const name = this.name().trim();
    const storageId = this.storageId();

    if (!name || !storageId || !this.expiryDate() || this.saving()) {
      return;
    }

    this.save.emit({
      name,
      barcode: this.barcode().trim() || null,
      storage_id: storageId,
      expiry_date: this.expiryDate(),
      expiry_type: this.expiryType(),
      package_size: this.packageSize(),
      package_unit: this.packageUnit().trim() || null,
    });
  }
}
