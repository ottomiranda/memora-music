import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, migrationApi } from '../config/api';
import { getCurrentGuestId, clearGuestId } from '../utils/guest';
import { LoginResponse, SignupResponse, SignupData, MigrationResult } from '../types/guest';

/**
 * Função para migrar dados do convidado para o usuário logado
 */
const migrateGuestData = async (guestId: string): Promise<MigrationResult | null> => {
  try {
    console.log('[AuthStore] Iniciando migração de dados do convidado:', guestId);
    
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
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoggedIn: false, // Sempre inicia como false
      isLoading: false,
      error: null,

      login: async (credentials) => {
        set({ isLoading: true, error: null });
        
        // Captura o guestId antes do login (se existir)
        const guestId = getCurrentGuestId();
        console.log('[AuthStore] Login iniciado. GuestId atual:', guestId);
        
        try {
          const response: LoginResponse = await authApi.login(credentials.email, credentials.password);
          
          console.log('[AuthStore] Login bem-sucedido:', response.user.email);
          
          // Atualizar estado com dados do usuário
          set({ 
            user: response.user,
            token: response.token,
            isLoggedIn: true,
            error: null 
          });
          
          // Migrar dados do convidado se existir guestId
          if (guestId) {
            console.log('[AuthStore] Iniciando migração de dados do convidado');
            const migrationResult = await migrateGuestData(guestId);
            
            if (migrationResult) {
              console.log('[AuthStore] Migração concluída:', migrationResult);
            }
            
            // Limpar guestId após migração (independente do resultado)
            clearGuestId();
            console.log('[AuthStore] GuestId removido do localStorage');
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
          const response: SignupResponse = await authApi.signup(data as SignupData);
          
          console.log('[AuthStore] Signup bem-sucedido:', response.user.email);
          
          // Atualizar estado com dados do usuário
          set({ 
            user: response.user,
            token: response.token,
            isLoggedIn: true,
            error: null 
          });
          
          // Migrar dados do convidado se existir guestId
          if (guestId) {
            console.log('[AuthStore] Iniciando migração de dados do convidado');
            const migrationResult = await migrateGuestData(guestId);
            
            if (migrationResult) {
              console.log('[AuthStore] Migração concluída:', migrationResult);
            }
            
            // Limpar guestId após migração (independente do resultado)
            clearGuestId();
            console.log('[AuthStore] GuestId removido do localStorage');
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
        set({ 
          user: null,
          token: null,
          isLoggedIn: false, 
          error: null 
        });
      },

      clearError: () => {
        set({ error: null });
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