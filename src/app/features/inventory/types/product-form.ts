import { ProductDto } from '../../../core/api/models';

export interface ManualProductEntry {
  id: number;
  name: string;
  barcode: string;
  expiryDate: string;
  quantity: number;
}

export interface ManualProductSubmission {
  storageId: string;
  products: ProductDto[];
}

