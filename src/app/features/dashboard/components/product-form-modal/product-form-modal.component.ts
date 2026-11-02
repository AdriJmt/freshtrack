import { computed } from '@angular/core';
import { remainingQuantity } from '../../../inventory/utils/product-quantity';
import { ManualProductSubmission } from '../../../inventory/types/product-form';
import { ModalComponent } from '../../../../shared/ui/modal/modal.component';
import { Component, input, output } from '@angular/core';
import { ProductDto, StorageDto } from '../../../../core/api/models';
import { ManualProductFormComponent } from '../manual-product-form/manual-product-form.component';
@Component({
  selector: 'app-product-form-modal',
  imports: [ModalComponent, ManualProductFormComponent],
  templateUrl: './product-form-modal.component.html',
  styleUrl: './product-form-modal.component.scss',
})
export class ProductFormModalComponent {
  readonly product = input<ProductDto | null>(null);
  readonly formProduct = computed(() => this.product() ? { ...this.product()!, quantity: remainingQuantity(this.product()!) } : null);
  readonly storages = input.required<StorageDto[]>();
  readonly saving = input(false);
  readonly errorMessage = input<string | null>(null);
  readonly save = output<ManualProductSubmission>();
  readonly cancel = output<void>();
}
