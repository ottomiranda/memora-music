import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let clientPromise: Promise<SupabaseClient | null> | null = null;

export const getSupabaseBrowserClient = (): Promise<SupabaseClient | null> => {
  if (clientPromise) return clientPromise;

  clientPromise = (async () => {
    try {
      // Try Vite env first
      const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_URL;
      const envAnon = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      let url = envUrl as string | undefined;
      let anonKey = envAnon as string | undefined;

      // Fallback: fetch from backend public config
      if (!url || !anonKey) {
        const apiBase = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3003';
        const resp = await fetch(`${apiBase}/api/supabase/public-config`);
        if (resp.ok) {
          const data = await resp.json();
          if (data?.success) {
            url = data.url;
            anonKey = data.anonKey;
          }
        }
      }

      if (!url || !anonKey) {
        console.error('[SUPABASE_BROWSER] Configuração pública ausente');
        return null;
      }

      const client = createClient(url, anonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      });

      return client;
    } catch (e) {
      console.error('[SUPABASE_BROWSER] Falha ao inicializar cliente:', e);
      return null;
    }
  })();

  return clientPromise;
};

export default getSupabaseBrowserClient;

