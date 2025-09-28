import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { migrationApi } from '../config/api';
import getSupabaseBrowserClient from '@/lib/supabase-browser';
import { getCurrentGuestId, clearGuestId } from '../utils/guest';
import { LoginResponse, SignupResponse, SignupData, MigrationResult } from '../types/guest';
import i18n from '../i18n';
import { useUiStore } from './uiStore';

/**
 * Função para migrar dados do convidado para o usuário logado
 * Agora inclui chamada automática da função merge_guest_into_user
 */
const migrateGuestData = async (guestId: string): Promise<MigrationResult | null> => {
  try {
    console.log(i18n.t('migration.startingGuestData', { ns: 'authStore' }), guestId);
    
    // Obter deviceId do localStorage
    const deviceId = localStorage.getItem('deviceId');
    console.log('[AuthStore] DeviceId encontrado:', deviceId);
    
    if (!deviceId) {
      console.warn(i18n.t('migration.deviceIdNotFound', { ns: 'authStore' }));
    }
    
    const result = await migrationApi.migrateGuestData(guestId);
    
    console.log(i18n.t('migration.completedSuccessfully', { ns: 'authStore' }), result);
    return result;
  } catch (error) {
    console.error(i18n.t('migration.errorMigratingData', { ns: 'authStore' }), error);
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
  resendConfirmationEmail: (email: string) => Promise<boolean>;
  syncSession: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null, // Não ler diretamente do localStorage aqui
      isLoggedIn: false, // Sempre iniciar como false
      isLoading: true, // Iniciar como loading até a hidratação estar completa
      error: null,

      login: async (credentials) => {
        set({ isLoading: true, error: null });
        
        // Captura o guestId antes do login (se existir)
        const guestId = getCurrentGuestId();
        console.log('[AuthStore] Login iniciado. GuestId atual:', guestId);
        
        try {
          const supabase = await getSupabaseBrowserClient();
          if (!supabase) throw new Error(i18n.t('auth.supabaseInitFailed', { ns: 'authStore' }));

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
          if (!accessToken || !user) throw new Error(i18n.t('auth.invalidSession', { ns: 'authStore' }));

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
                  console.log(i18n.t('migration.guestIdRemoved', { ns: 'authStore' }));
                }
              } else {
                console.warn(i18n.t('migration.notCompleted', { ns: 'authStore' }));
              }
            } catch (e) {
              console.warn(i18n.t('migration.failed', { ns: 'authStore' }), e);
            }
          }
          
          return true;
        } catch (error: unknown) {
          console.error('[AuthStore] Erro no login:', error);
          
          const errorMessage = error instanceof Error ? error.message : i18n.t('auth.invalidCredentials', { ns: 'authStore' });
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
          
          const errorMessage = error instanceof Error ? error.message : i18n.t('auth.unknownSignupError', { ns: 'authStore' });
          set({ error: errorMessage });
          
          // Re-lançar o erro para que o componente UI também possa reagir
          throw error;
        } finally {
          // Garantir que isLoading seja sempre resetado
          set({ isLoading: false });
        }
      },

      logout: async () => {
        try {
          const { suppressAuthPopup, hideAuthPopup } = useUiStore.getState();
          suppressAuthPopup();
          hideAuthPopup();
          // Limpar completamente o localStorage
          localStorage.removeItem('authToken');
          localStorage.removeItem('guestId');
          
          // Fazer signOut no Supabase de forma síncrona
          const supabase = await getSupabaseBrowserClient();
          if (supabase) {
            await supabase.auth.signOut();
          }
          
          // Limpar o estado do Zustand
          set({ user: null, token: null, isLoggedIn: false, error: null });
          
          // Limpar o storage persistido do Zustand
          useAuthStore.persist.clearStorage();
          
          console.log(i18n.t('auth.logoutCompleted', { ns: 'authStore' }));
          
          // Redirecionar para a página inicial após logout
          window.location.href = '/';
        } catch (error) {
          console.error(i18n.t('auth.logoutError', { ns: 'authStore' }), error);
          // Mesmo com erro, limpar dados locais e redirecionar
          const { suppressAuthPopup, hideAuthPopup } = useUiStore.getState();
          suppressAuthPopup();
          hideAuthPopup();
          localStorage.removeItem('authToken');
          localStorage.removeItem('guestId');
          set({ user: null, token: null, isLoggedIn: false, error: null });
          window.location.href = '/';
        }
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

      resendConfirmationEmail: async (email: string) => {
        set({ isLoading: true, error: null });
        try {
          const supabase = await getSupabaseBrowserClient();
          if (!supabase) throw new Error('Falha ao inicializar Supabase');
          
          const { error } = await supabase.auth.resend({
            type: 'signup',
            email: email,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            }
          });
          
          if (error) throw error;
          return true;
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'Erro ao reenviar email de confirmação';
          set({ error: msg });
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      // Função para sincronizar sessão do Supabase com o authStore
      syncSession: async () => {
        try {
          const supabase = await getSupabaseBrowserClient();
          if (!supabase) throw new Error('Falha ao inicializar Supabase');

          const { data: sessionData, error } = await supabase.auth.getSession();
          if (error) throw error;

          if (sessionData.session) {
            const { access_token, user } = sessionData.session;
            const userData = {
              id: user.id,
              email: user.email || '',
              name: user.user_metadata?.name || user.email || ''
            };

            // Atualizar localStorage e estado
            localStorage.setItem('authToken', access_token);
            set({ 
              user: userData, 
              token: access_token, 
              isLoggedIn: true, 
              error: null 
            });

            console.log('[AuthStore] Sessão sincronizada:', userData);
            return true;
          } else {
            // Limpar dados se não há sessão
            localStorage.removeItem('authToken');
            set({ user: null, token: null, isLoggedIn: false });
            return false;
          }
        } catch (error) {
          console.error('[AuthStore] Erro ao sincronizar sessão:', error);
          const errorMessage = error instanceof Error ? error.message : 'Erro ao sincronizar sessão';
          set({ error: errorMessage });
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
console.log(i18n.t('hydration.configuring', { ns: 'authStore' }));
useAuthStore.persist.onFinishHydration(async (state) => {
  console.log(i18n.t('hydration.started', { ns: 'authStore' }), { persistedToken: state.token });
  
  try {
    // Verificar token no localStorage também
    const localStorageToken = localStorage.getItem('authToken');
    const tokenToUse = state.token || localStorageToken;
    
    console.log(i18n.t('hydration.tokensFound', { ns: 'authStore' }), { persisted: state.token, localStorage: localStorageToken });
    
    if (tokenToUse) {
      try {
        // Verificar se a sessão ainda é válida no Supabase
        const supabase = await getSupabaseBrowserClient();
        if (supabase) {
          console.log(i18n.t('hydration.supabaseInitialized', { ns: 'authStore' }));
          const { data: sessionData, error } = await supabase.auth.getSession();
          
          if (!error && sessionData.session) {
            // Sessão válida - manter usuário logado
            const userData = {
              id: sessionData.session.user.id,
              email: sessionData.session.user.email || '',
              name: sessionData.session.user.user_metadata?.name || sessionData.session.user.email || ''
            };
            
            localStorage.setItem('authToken', sessionData.session.access_token);
            useAuthStore.setState({ 
              user: userData,
              token: sessionData.session.access_token,
              isLoggedIn: true,
              isLoading: false,
              error: null
            });
            
            console.log(i18n.t('hydration.completedAuthenticated', { ns: 'authStore' }), userData);
            return;
          } else {
            console.log(i18n.t('hydration.invalidSession', { ns: 'authStore' }), error);
          }
        } else {
          console.error(i18n.t('hydration.supabaseInitFailed', { ns: 'authStore' }));
        }
      } catch (error) {
        console.error(i18n.t('hydration.sessionCheckError', { ns: 'authStore' }), error);
      }
      
      // Se chegou aqui, o token é inválido - limpar tudo
      localStorage.removeItem('authToken');
      console.log(i18n.t('hydration.invalidTokenRemoved', { ns: 'authStore' }));
    }
    
    // Finalizar hidratação como não logado
    useAuthStore.setState({ 
      user: null,
      token: null,
      isLoggedIn: false,
      isLoading: false,
      error: null
    });
    
    console.log(i18n.t('hydration.completedUnauthenticated', { ns: 'authStore' }));
  } catch (error) {
    console.error(i18n.t('hydration.criticalError', { ns: 'authStore' }), error);
    // Garantir que isLoading seja sempre false, mesmo em caso de erro
    useAuthStore.setState({ 
      user: null,
      token: null,
      isLoggedIn: false,
      isLoading: false,
      error: i18n.t('hydration.initializationError', { ns: 'authStore' })
    });
  }
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
