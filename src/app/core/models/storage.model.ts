export type StorageType = 'fridge' | 'cupboard';

export interface Storage {
  id: string;
  user_id: string;
  name: string;
  type: StorageType;
  created_at: string;
}

export interface CreateStorage {
  name: string;
  type: StorageType;
}

export type UpdateStorage = Partial<CreateStorage>;
