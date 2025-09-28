import { create } from 'zustand';
export const useUiStore = create((set, get) => ({
    isAuthModalOpen: false,
    authCallback: null,
    isPaymentPopupVisible: false,
    isCreationFlowBlocked: false,
    isAuthPopupSuppressed: false,
    showAuthPopup: (callback) => {
        if (get().isAuthPopupSuppressed) {
            console.debug('[UI] Auth popup suprimido - ignorando solicitação');
            return;
        }
        set({
            isAuthModalOpen: true,
            authCallback: callback ?? null
        });
    },
    hideAuthPopup: () => {
        set({
            isAuthModalOpen: false,
            authCallback: null
        });
    },
    executeAuthCallback: () => {
        const { authCallback } = get();
        if (authCallback) {
            authCallback();
            set({ authCallback: null });
        }
    },
    suppressAuthPopup: (duration = 1500) => {
        set({
            isAuthPopupSuppressed: true,
            isAuthModalOpen: false,
            authCallback: null,
        });
        if (duration > 0) {
            setTimeout(() => {
                set({ isAuthPopupSuppressed: false });
            }, duration);
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
//# sourceMappingURL=uiStore.js.map