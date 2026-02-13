import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser client for client components
export function createBrowserSupabaseClient(): SupabaseClient {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// Server client for API routes (requires cookies)
export function createServerSupabaseClient(cookieStore: {
  get: (name: string) => { value: string } | undefined;
  set: (name: string, value: string, options?: object) => void;
  delete: (name: string) => void;
}): SupabaseClient {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: object) {
        cookieStore.set(name, value, options);
      },
      remove(name: string, options: object) {
        cookieStore.delete(name);
      },
    },
  });
}

// Simple client for server-side operations (no auth needed)
export function createServiceClient(): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey);
}

// Singleton browser client for use in components
let browserClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (typeof window === 'undefined') {
    throw new Error('getSupabaseClient can only be called on the client side');
  }
  if (!browserClient) {
    browserClient = createBrowserSupabaseClient();
  }
  return browserClient;
}
