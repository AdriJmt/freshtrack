import type { SupportedStorage } from '@supabase/supabase-js';

let rememberMe = true;

export function setRememberMe(value: boolean): void {
  rememberMe = value;
}

function getStorage(): Storage {
  return rememberMe ? localStorage : sessionStorage;
}

export const authStorage: SupportedStorage = {
  getItem(key: string): string | null {
    return getStorage().getItem(key);
  },

  setItem(key: string, value: string): void {
    getStorage().setItem(key, value);
  },

  removeItem(key: string): void {
    getStorage().removeItem(key);
  },
};
