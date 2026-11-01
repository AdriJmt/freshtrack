import { Injectable } from '@angular/core';

import { CreateProduct, Product, UpdateProduct } from '../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  async getAll(): Promise<Product[]> {
    return [];
  }

  async getById(_id: string): Promise<Product | null> {
    return null;
  }

  async createMany(
    _storageId: string,
    _products: CreateProduct[],
  ): Promise<Product[]> {
    return [];
  }

  async update(_id: string, _changes: UpdateProduct): Promise<Product> {
    throw new Error('ProductService temporairement indisponible.');
  }

  async delete(_id: string): Promise<void> {
    return;
  }
}
