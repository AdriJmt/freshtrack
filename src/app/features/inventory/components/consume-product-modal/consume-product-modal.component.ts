import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProductDto } from '../../../../core/api/models';
import { ModalComponent } from '../../../../shared/ui/modal/modal.component';
import { remainingQuantity } from '../../utils/product-quantity';
@Component({ selector: 'app-consume-product-modal', imports: [FormsModule, ModalComponent], templateUrl: './consume-product-modal.component.html', styleUrl: './consume-product-modal.component.scss' })
export class ConsumeProductModalComponent {
  readonly product = input.required<ProductDto>();
  readonly busy = input(false);
  readonly error = input('');
  readonly cancel = output<void>();
  readonly confirm = output<number>();
  readonly remaining = remainingQuantity;
  quantity = 1;
  valid(): boolean { return Number.isInteger(this.quantity) && this.quantity >= 1 && this.quantity <= remainingQuantity(this.product()); }
  submit(): void { if (!this.busy() && this.valid()) this.confirm.emit(this.quantity); }
}
