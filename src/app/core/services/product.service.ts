import { Injectable } from '@angular/core';

import { supabase } from '../supabase.client';
import { CreateProduct, Product, UpdateProduct } from '../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  async getAll(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('expiry_date', { ascending: true });

    if (error) {
      throw error;
    }

    return (data ?? []) as Product[];
  }

  async getById(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data as Product | null;
  }

  async createMany(
    storageId: string,
    products: CreateProduct[],
  ): Promise<Product[]> {
    const { data, error } = await supabase.rpc('create_products_batch', {
      p_storage_id: storageId,
      p_products: products,
    });

    if (error) {
      throw error;
    }

    return (data ?? []) as Product[];
  }

  async update(id: string, changes: UpdateProduct): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .update(changes)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as Product;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('products').delete().eq('id', id);

    if (error) {
      throw error;
    }
  }
}
