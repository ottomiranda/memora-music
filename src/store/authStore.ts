import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
        
        try {
          // Simular chamada de API para login
          // TODO: Substituir por chamada real para o backend
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
          });

          if (response.ok) {
            const userData = await response.json();
            set({ 
              user: userData.user,
              token: userData.token,
              isLoggedIn: true, 
              isLoading: false,
              error: null 
            });
            return true;
          } else {
            const errorData = await response.json();
            set({ 
              error: errorData.message || 'Erro ao fazer login', 
              isLoading: false 
            });
            return false;
          }
        } catch (error) {
          // Por enquanto, simular login bem-sucedido para desenvolvimento
          console.log('Simulando login bem-sucedido:', credentials.email);
          const simulatedToken = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          set({ 
            user: { 
              id: '1', 
              email: credentials.email, 
              name: credentials.email.split('@')[0] 
            },
            token: simulatedToken,
            isLoggedIn: true, 
            isLoading: false,
            error: null 
          });
          return true;
        }
      },

      signup: async (data) => {
        console.log('[DEBUG] authStore.signup recebido. Payload:', data);
        set({ isLoading: true, error: null });
        
        try {
          // Simular chamada de API para cadastro
          // TODO: Substituir por chamada real para o backend
          const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          });

          if (response.ok) {
            const userData = await response.json();
            set({ 
              user: userData.user,
              token: userData.token,
              isLoggedIn: true, 
              isLoading: false,
              error: null 
            });
            return true;
          } else {
            const errorData = await response.json();
            set({ 
              error: errorData.message || 'Erro ao criar conta', 
              isLoading: false 
            });
            return false;
          }
        } catch (error) {
          // Por enquanto, simular cadastro bem-sucedido para desenvolvimento
          console.log('Simulando cadastro bem-sucedido:', data.email);
          const simulatedToken = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          set({ 
            user: { 
              id: '1', 
              email: data.email, 
              name: data.name || data.email.split('@')[0] 
            },
            token: simulatedToken,
            isLoggedIn: true, 
            isLoading: false,
            error: null 
          });
          return true;
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