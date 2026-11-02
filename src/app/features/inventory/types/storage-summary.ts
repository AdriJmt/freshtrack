import { ProductDto } from '../../../core/api/models';
export interface StorageSummary {
  references: number;
  quantity: number;
  urgent: number;
  preview: ProductDto[];
}
