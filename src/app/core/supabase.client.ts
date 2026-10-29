import { createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { authStorage } from './auth.storage';

export const supabase = createClient(
  environment.supabaseUrl,
  environment.supabasePublishableKey,
  {
    auth: {
      storage: authStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  },
);
