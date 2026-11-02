import { remainingQuantity } from '../../../inventory/utils/product-quantity';
import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductDto } from '../../../../core/api/models';
import { ProductImageComponent } from '../../../../shared/ui/product-image/product-image.component';
import { expiryInfo } from '../../../inventory/utils/product-expiry';

@Component({
  selector: 'app-product-card',
  imports: [ProductImageComponent, RouterLink],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss',
})
export class ProductCardComponent {
  readonly product = input.required<ProductDto>();
  readonly storageName = input.required<string>();
  readonly history = input(false);
  readonly editable = input(true);
  readonly remaining = computed(() => remainingQuantity(this.product()));
  readonly shownQuantity = computed(() => this.history() ? this.product().consumedQuantity ?? 0 : this.remaining());
  readonly consume = output<ProductDto>();
  readonly edit = output<ProductDto>();
  readonly delete = output<ProductDto>();
  readonly expiry = computed(() => expiryInfo(this.product().expiryDate));
}
