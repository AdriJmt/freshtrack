import { ProductDto } from '../../../core/api/models';

/** Remaining stock is independent from the cumulative consumed quantity. */
export function remainingQuantity(product: ProductDto): number {
  return Math.max(0, (product.quantity ?? 1) - (product.consumedQuantity ?? 0));
}
