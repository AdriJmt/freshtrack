import { remainingQuantity } from '../../../inventory/utils/product-quantity';
import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductDto } from '../../../../core/api/models';
import { expiryInfo } from '../../../inventory/utils/product-expiry';
@Component({
  selector: 'app-dashboard-stats',
  imports: [RouterLink],
  templateUrl: './dashboard-stats.component.html',
  styleUrl: './dashboard-stats.component.scss',
})
export class DashboardStatsComponent {
  readonly products = input.required<ProductDto[]>();
  readonly references = computed(() => this.products().filter(product => remainingQuantity(product) > 0).length);
  readonly storageCount = input(0);
  readonly counts = computed(() => {
    const counts = { all: 0, soon: 0, expired: 0, consumed: 0 };
    for (const product of this.products()) {
      counts.consumed += product.consumedQuantity ?? 0;
      const quantity = remainingQuantity(product),
        status = expiryInfo(product.expiryDate).status;
      counts.all += quantity;
      if (status === 'soon' || status === 'expired') counts[status] += quantity;
    }
    return counts;
  });
}
