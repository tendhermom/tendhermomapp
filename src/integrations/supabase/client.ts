import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const memoryStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
  };
})();

const safeStorage = {
  getItem: (key: string) => {
    try { return window.localStorage.getItem(key); }
    catch (_) { return memoryStorage.getItem(key); }
  },
  setItem: (key: string, value: string) => {
    try { window.localStorage.setItem(key, value); }
    catch (_) { memoryStorage.setItem(key, value); }
  },
  removeItem: (key: string) => {
    try { window.localStorage.removeItem(key); }
    catch (_) { memoryStorage.removeItem(key); }
  },
};

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: safeStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});