import { create } from 'zustand';

interface UiState {
  isAuthModalOpen: boolean;
  authCallback: (() => void) | null;
  isPaymentPopupVisible: boolean;
  isCreationFlowBlocked: boolean;
  theme: 'light' | 'dark' | 'system';
  setTheme: (t: UiState['theme']) => void;
  showAuthPopup: (callback?: () => void) => void;
  hideAuthPopup: () => void;
  executeAuthCallback: () => void;
  showPaymentPopup: () => void;
  hidePaymentPopup: () => void;
  handleUpgrade: () => void;
  blockCreationFlow: () => void;
  unblockCreationFlow: () => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  isAuthModalOpen: false,
  authCallback: null,
  isPaymentPopupVisible: false,
  isCreationFlowBlocked: false,
  theme: (() => {
    try { return (localStorage.getItem('theme') as UiState['theme']) || 'system'; } catch { return 'system'; }
  })(),
  setTheme: (t) => {
    try { localStorage.setItem('theme', t); } catch {}
    const root = document.documentElement;
    const preferDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = t === 'dark' || (t === 'system' && preferDark);
    root.classList.toggle('dark', isDark);
    set({ theme: t });
  },
   
  showAuthPopup: (callback?: () => void) => {
    set({ 
      isAuthModalOpen: true, 
      authCallback: callback 
    });
  },
   
  hideAuthPopup: () => {
    set({ 
      isAuthModalOpen: false, 
      authCallback: undefined 
    });
  },
   
  executeAuthCallback: () => {
    const { authCallback } = get();
    if (authCallback) {
      authCallback();
      set({ authCallback: undefined });
    }
  },

  showPaymentPopup: () => {
    console.log('[PAYWALL] Modal de pagamento acionado - usuário precisa pagar');
    set({ isPaymentPopupVisible: true });
  },

  hidePaymentPopup: () => {
    console.log('[PAYWALL] Modal de pagamento fechado');
    set({ isPaymentPopupVisible: false });
  },

  handleUpgrade: () => {
    console.log('[PAYWALL] Usuário clicou em Fazer Upgrade. Redirecionando para página de pagamento...');
    // Futuramente, adicione a lógica de redirecionamento aqui.
    set({ isPaymentPopupVisible: false });
  },

  blockCreationFlow: () => {
    console.log('[PAYWALL] Fluxo de criação bloqueado');
    set({ isCreationFlowBlocked: true });
  },

  unblockCreationFlow: () => {
    console.log('[PAYWALL] Fluxo de criação desbloqueado');
    set({ isCreationFlowBlocked: false });
  }
}));
