import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { migrationApi } from '../config/api';
import getSupabaseBrowserClient from '@/lib/supabase-browser';
import { getCurrentGuestId, clearGuestId } from '../utils/guest';
import { LoginResponse, SignupResponse, SignupData, MigrationResult } from '../types/guest';

/**
 * Função para migrar dados do convidado para o usuário logado
 * Agora inclui chamada automática da função merge_guest_into_user
 */
const migrateGuestData = async (guestId: string): Promise<MigrationResult | null> => {
  try {
    console.log('[AuthStore] Iniciando migração de dados do convidado:', guestId);
    
    // Obter deviceId do localStorage
    const deviceId = localStorage.getItem('deviceId');
    console.log('[AuthStore] DeviceId encontrado:', deviceId);
    
    if (!deviceId) {
      console.warn('[AuthStore] DeviceId não encontrado. Migração pode não funcionar corretamente.');
    }
    
    const result = await migrationApi.migrateGuestData(guestId);
    
    console.log('[AuthStore] Migração concluída com sucesso:', result);
    return result;
  } catch (error) {
    console.error('[AuthStore] Erro ao migrar dados do convidado:', error);
    // Não falha o login/cadastro por causa da migração
    return null;
  }
};

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: { email: string; password: string }) => Promise<boolean>;
  signup: (data: { email: string; password: string; name?: string }) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  resetPassword: (email: string) => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: localStorage.getItem('authToken') || null,
      isLoggedIn: !!localStorage.getItem('authToken'),
      isLoading: false,
      error: null,

      login: async (credentials) => {
        set({ isLoading: true, error: null });
        
        // Captura o guestId antes do login (se existir)
        const guestId = getCurrentGuestId();
        console.log('[AuthStore] Login iniciado. GuestId atual:', guestId);
        
        try {
          const supabase = await getSupabaseBrowserClient();
          if (!supabase) throw new Error('Falha ao inicializar Supabase');

          const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });
          if (error) throw error;

          const accessToken = data.session?.access_token;
          const user = data.user ? {
            id: data.user.id,
            email: data.user.email || credentials.email,
            name: (data.user.user_metadata && (data.user.user_metadata as any).name) || undefined
          } : null;
          if (!accessToken || !user) throw new Error('Sessão inválida');

          localStorage.setItem('authToken', accessToken);
          set({ user, token: accessToken, isLoggedIn: true, error: null });
          
          // Migrar dados do convidado se existir guestId ou deviceId
          const deviceId = localStorage.getItem('deviceId');
          if (guestId || deviceId) {
            console.log('[AuthStore] Iniciando migração de dados do convidado');
            try {
              const migrationResult = await migrateGuestData(guestId || user.id);
              if (migrationResult && (migrationResult.success === true || migrationResult.data?.migratedCount >= 0)) {
                console.log('[AuthStore] Migração concluída:', migrationResult);
                if (guestId) {
                  clearGuestId();
                  console.log('[AuthStore] GuestId removido do localStorage');
                }
              } else {
                console.warn('[AuthStore] Migração não concluída. GuestId será mantido para nova tentativa.');
              }
            } catch (e) {
              console.warn('[AuthStore] Migração falhou. GuestId será mantido:', e);
            }
          }
          
          return true;
        } catch (error: unknown) {
          console.error('[AuthStore] Erro no login:', error);
          
          const errorMessage = error instanceof Error ? error.message : 'Email ou senha inválidos.';
          set({ error: errorMessage });
          
          // Re-lançar o erro para que o componente UI também possa reagir
          throw error;
        } finally {
          // Garantir que isLoading seja sempre resetado
          set({ isLoading: false });
        }
      },

      signup: async (data) => {
        console.log('[AuthStore] Signup iniciado. Payload:', data);
        set({ isLoading: true, error: null });
        
        // Captura o guestId antes do cadastro (se existir)
        const guestId = getCurrentGuestId();
        console.log('[AuthStore] Signup iniciado. GuestId atual:', guestId);
        
        try {
          const supabase = await getSupabaseBrowserClient();
          if (!supabase) throw new Error('Falha ao inicializar Supabase');

          const { data: signUpData, error } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
              data: { name: data.name },
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
          });
          if (error) throw error;

          // Em projetos com confirmação de email, session pode ser null.
          // Tentar obter sessão atual (se o projeto não exige confirmação).
          const session = (await supabase.auth.getSession()).data.session;
          const accessToken = session?.access_token || null;
          const user = signUpData.user ? { id: signUpData.user.id, email: signUpData.user.email || data.email, name: data.name } : null;

          if (accessToken && user) {
            localStorage.setItem('authToken', accessToken);
            set({ user, token: accessToken, isLoggedIn: true, error: null });
          } else {
            // Caso de confirmação por email
            set({ user, token: null, isLoggedIn: false, error: null });
          }
          
          // Migrar dados do convidado se existir guestId ou deviceId
          const deviceId = localStorage.getItem('deviceId');
          if (guestId || deviceId) {
            console.log('[AuthStore] Iniciando migração de dados do convidado');
            try {
              const migrationResult = await migrateGuestData(guestId || user.id);
              if (migrationResult && (migrationResult.success === true || migrationResult.data?.migratedCount >= 0)) {
                console.log('[AuthStore] Migração concluída:', migrationResult);
                if (guestId) {
                  clearGuestId();
                  console.log('[AuthStore] GuestId removido do localStorage');
                }
              } else {
                console.warn('[AuthStore] Migração não concluída. GuestId será mantido para nova tentativa.');
              }
            } catch (e) {
              console.warn('[AuthStore] Migração falhou. GuestId será mantido:', e);
            }
          }
          
          return true;
        } catch (error: unknown) {
          console.error('[AuthStore] Erro no signup:', error);
          
          const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao criar conta.';
          set({ error: errorMessage });
          
          // Re-lançar o erro para que o componente UI também possa reagir
          throw error;
        } finally {
          // Garantir que isLoading seja sempre resetado
          set({ isLoading: false });
        }
      },

      logout: () => {
        localStorage.removeItem('authToken');
        // Sair no Supabase também
        getSupabaseBrowserClient().then((supabase) => {
          supabase?.auth.signOut();
        });
        set({ user: null, token: null, isLoggedIn: false, error: null });
      },

      clearError: () => {
        set({ error: null });
      },

      resetPassword: async (email: string) => {
        try {
          const supabase = await getSupabaseBrowserClient();
          if (!supabase) throw new Error('Falha ao inicializar Supabase');
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/reset`,
          });
          if (error) throw error;
          return true;
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'Erro ao solicitar recuperação de senha';
          set({ error: msg });
          return false;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user,
        token: state.token
        // isLoggedIn NÃO é persistido - sempre derivado do token
      }),
    }
  )
);

// Lógica de hidratação inicial para garantir que isLoggedIn esteja correto no carregamento
useAuthStore.persist.onFinishHydration((state) => {
  // Define isLoggedIn baseado na presença de um token válido
  const hasValidToken = !!state.token;
  console.log('Hidratação do authStore:', { hasToken: hasValidToken, token: state.token });
  
  useAuthStore.setState({ 
    isLoggedIn: hasValidToken 
  });
});

// Sincronizar sessão do Supabase → authStore (renovação de token, refresh etc.)
getSupabaseBrowserClient().then((supabase) => {
  supabase?.auth.onAuthStateChange((_event, session) => {
    const token = session?.access_token || null;
    if (token) {
      localStorage.setItem('authToken', token);
      const current = useAuthStore.getState();
      useAuthStore.setState({
        token,
        isLoggedIn: true,
        user: current.user || (session?.user ? { id: session.user.id, email: session.user.email || '' } : null),
      });
    }
  });
});
