import { remainingQuantity } from '../../../inventory/utils/product-quantity';
import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductDto } from '../../../../core/api/models';
import { expiryInfo } from '../../../inventory/utils/product-expiry';
import { ProductCardComponent } from '../product-card/product-card.component';
@Component({
  selector: 'app-expiring-widget',
  imports: [RouterLink, ProductCardComponent],
  templateUrl: './expiring-widget.component.html',
  styleUrl: './expiring-widget.component.scss',
})
export class ExpiringWidgetComponent {
  readonly products = input.required<ProductDto[]>();
  readonly storageNames = input.required<Map<string | undefined, string>>();
  readonly priority = computed(() =>
    this.products()
      .filter((product) =>
        remainingQuantity(product) > 0 && ['expired', 'soon'].includes(expiryInfo(product.expiryDate).status),
      )
      .sort((a, b) => (a.expiryDate ?? '').localeCompare(b.expiryDate ?? ''))
      .slice(0, 6),
  );
}
