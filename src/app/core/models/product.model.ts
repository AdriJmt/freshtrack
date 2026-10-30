export type ExpiryType = 'DLC' | 'DDM';

export interface Product {
  id: string;
  user_id: string;
  storage_id: string;
  name: string;
  barcode: string | null;
  expiry_date: string;
  expiry_type: ExpiryType;
  package_size: number | null;
  package_unit: string | null;
  created_at: string;
}

export interface CreateProduct {
  name: string;
  barcode?: string | null;
  expiry_date: string;
  expiry_type: ExpiryType;
  package_size?: number | null;
  package_unit?: string | null;
}

export type UpdateProduct = Partial<CreateProduct> & {
  storage_id?: string;
};
