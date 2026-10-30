import { Injectable } from '@angular/core';

import { supabase } from '../supabase.client';
import { CreateStorage, Storage, UpdateStorage } from '../models/storage.model';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  async getAll(): Promise<Storage[]> {
    const { data, error } = await supabase
      .from('storages')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    return (data ?? []) as Storage[];
  }

  async create(storage: CreateStorage): Promise<Storage> {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!userData.user) {
      throw new Error('Utilisateur non authentifié.');
    }

    const { data, error } = await supabase
      .from('storages')
      .insert({
        ...storage,
        user_id: userData.user.id,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as Storage;
  }

  async update(id: string, changes: UpdateStorage): Promise<Storage> {
    const { data, error } = await supabase
      .from('storages')
      .update(changes)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as Storage;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('storages').delete().eq('id', id);

    if (error) {
      throw error;
    }
  }
}
