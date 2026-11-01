import { Injectable } from '@angular/core';

import { CreateStorage, Storage, UpdateStorage } from '../models/storage.model';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  async getAll(): Promise<Storage[]> {
    return [];
  }

  async create(_storage: CreateStorage): Promise<Storage> {
    throw new Error('StorageService temporairement indisponible.');
  }

  async update(_id: string, _changes: UpdateStorage): Promise<Storage> {
    throw new Error('StorageService temporairement indisponible.');
  }

  async delete(_id: string): Promise<void> {
    return;
  }
}
