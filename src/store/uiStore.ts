import { create } from 'zustand';

interface UiState {
  isAuthModalOpen: boolean;
  authCallback: (() => void) | null;
  showAuthPopup: (callback?: () => void) => void;
  hideAuthPopup: () => void;
  executeAuthCallback: () => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  isAuthModalOpen: false,
  authCallback: null,
   
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
  }
}));