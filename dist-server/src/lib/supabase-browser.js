import { createClient } from '@supabase/supabase-js';
import { API_BASE_URL } from '@/config/api';
let clientPromise = null;
export const getSupabaseBrowserClient = () => {
    if (clientPromise)
        return clientPromise;
    clientPromise = (async () => {
        try {
            // Try Vite env first
            const envUrl = import.meta.env?.VITE_SUPABASE_URL || import.meta.env?.NEXT_PUBLIC_SUPABASE_URL;
            const envAnon = import.meta.env?.VITE_SUPABASE_ANON_KEY || import.meta.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY;
            let url = envUrl;
            let anonKey = envAnon;
            // Fallback: fetch from backend public config
            if (!url || !anonKey) {
                const apiBase = API_BASE_URL || '';
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
        }
        catch (e) {
            console.error('[SUPABASE_BROWSER] Falha ao inicializar cliente:', e);
            return null;
        }
    })();
    return clientPromise;
};
export default getSupabaseBrowserClient;
//# sourceMappingURL=supabase-browser.js.map