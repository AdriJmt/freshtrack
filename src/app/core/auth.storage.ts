const REMEMBER_ME_KEY = 'freshtrack:remember-me';

function getStorage(): Storage {
  const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === 'true';

  return rememberMe ? localStorage : sessionStorage;
}

export function setRememberMe(value: boolean): void {
  localStorage.setItem(REMEMBER_ME_KEY, String(value));
}

export const authStorage = {
  getItem(key: string): string | null {
    return getStorage().getItem(key);
  },

  setItem(key: string, value: string): void {
    getStorage().setItem(key, value);
  },

  removeItem(key: string): void {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  },
};
