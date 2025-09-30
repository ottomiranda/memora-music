import React, { createContext, useContext, useEffect, useState } from 'react';

interface Announcement {
  id: string;
  message: string;
  priority: 'polite' | 'assertive';
  timestamp: number;
}

interface AccessibilityContextType {
  isHighContrast: boolean;
  isReducedMotion: boolean;
  fontSize: 'normal' | 'large' | 'extra-large';
  announcements: Announcement[];
  toggleHighContrast: () => void;
  setFontSize: (size: 'normal' | 'large' | 'extra-large') => void;
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'extra-large'>('normal');
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // Detectar preferências do sistema
  useEffect(() => {
    // Detectar preferência de movimento reduzido
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Carregar preferências salvas
  useEffect(() => {
    const savedContrast = localStorage.getItem('accessibility-high-contrast');
    const savedFontSize = localStorage.getItem('accessibility-font-size') as 'normal' | 'large' | 'extra-large';

    if (savedContrast === 'true') {
      setIsHighContrast(true);
    }

    if (savedFontSize && ['normal', 'large', 'extra-large'].includes(savedFontSize)) {
      setFontSize(savedFontSize);
    }
  }, []);

  // Aplicar classes CSS baseadas nas preferências
  useEffect(() => {
    const root = document.documentElement;
    
    // Alto contraste
    if (isHighContrast) {
      root.classList.add('accessibility-high-contrast');
    } else {
      root.classList.remove('accessibility-high-contrast');
    }

    // Tamanho da fonte
    root.classList.remove('accessibility-font-large', 'accessibility-font-extra-large');
    if (fontSize === 'large') {
      root.classList.add('accessibility-font-large');
    } else if (fontSize === 'extra-large') {
      root.classList.add('accessibility-font-extra-large');
    }

    // Movimento reduzido
    if (isReducedMotion) {
      root.classList.add('accessibility-reduced-motion');
    } else {
      root.classList.remove('accessibility-reduced-motion');
    }
  }, [isHighContrast, fontSize, isReducedMotion]);

  const toggleHighContrast = () => {
    const newValue = !isHighContrast;
    setIsHighContrast(newValue);
    localStorage.setItem('accessibility-high-contrast', newValue.toString());
  };

  const handleSetFontSize = (size: 'normal' | 'large' | 'extra-large') => {
    setFontSize(size);
    localStorage.setItem('accessibility-font-size', size);
  };

  // Função para anunciar mensagens para leitores de tela
  const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement: Announcement = {
      id: `announcement-${Date.now()}-${Math.random()}`,
      message,
      priority,
      timestamp: Date.now()
    };
    
    setAnnouncements(prev => [...prev, announcement]);
    
    // Remover anúncio após 3 segundos
    setTimeout(() => {
      setAnnouncements(prev => prev.filter(a => a.id !== announcement.id));
    }, 3000);
  };

  // Adicionar estilos CSS globais para acessibilidade
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      /* Foco visível melhorado */
      *:focus-visible {
        outline: 2px solid #3b82f6 !important;
        outline-offset: 2px !important;
        border-radius: 4px;
      }

      /* Alto contraste */
      .accessibility-high-contrast {
        filter: contrast(150%) brightness(110%);
      }

      .accessibility-high-contrast button,
      .accessibility-high-contrast a {
        border: 2px solid currentColor !important;
      }

      /* Tamanhos de fonte */
      .accessibility-font-large {
        font-size: 110% !important;
      }

      .accessibility-font-extra-large {
        font-size: 125% !important;
      }

      /* Movimento reduzido */
      .accessibility-reduced-motion *,
      .accessibility-reduced-motion *::before,
      .accessibility-reduced-motion *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }

      /* Melhorar contraste de texto */
      .accessibility-high-contrast .text-white\/50,
      .accessibility-high-contrast .text-white\/60,
      .accessibility-high-contrast .text-white\/70,
      .accessibility-high-contrast .text-white\/80 {
        color: white !important;
      }

      .accessibility-high-contrast .text-gray-400,
      .accessibility-high-contrast .text-gray-500,
      .accessibility-high-contrast .text-gray-600 {
        color: #1f2937 !important;
      }

      /* Melhorar visibilidade de botões */
      .accessibility-high-contrast button:hover,
      .accessibility-high-contrast a:hover {
        background-color: #3b82f6 !important;
        color: white !important;
      }

      /* Screen reader only */
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }

      /* Skip links */
      .skip-link {
        position: absolute;
        top: -40px;
        left: 6px;
        background: #000;
        color: #fff;
        padding: 8px;
        text-decoration: none;
        border-radius: 4px;
        z-index: 9999;
      }

      .skip-link:focus {
        top: 6px;
      }

      /* Melhorar área de toque em dispositivos móveis */
      @media (max-width: 768px) {
        button, a, [role="button"] {
          min-height: 44px;
          min-width: 44px;
        }
      }

      /* Indicadores de carregamento acessíveis */
      [aria-busy="true"] {
        cursor: wait;
      }

      /* Melhorar visibilidade de elementos interativos */
      button:disabled,
      [aria-disabled="true"] {
        opacity: 0.6;
        cursor: not-allowed;
      }
    `;
    
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Adicionar skip links
  useEffect(() => {
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Pular para o conteúdo principal';
    skipLink.className = 'skip-link';
    
    document.body.insertBefore(skipLink, document.body.firstChild);
    
    return () => {
      if (document.body.contains(skipLink)) {
        document.body.removeChild(skipLink);
      }
    };
  }, []);

  // Gerenciar foco para navegação por teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Esc para fechar modais
      if (e.key === 'Escape') {
        const activeModal = document.querySelector('[role="dialog"][aria-modal="true"]');
        if (activeModal) {
          const closeButton = activeModal.querySelector('[aria-label*="fechar"], [aria-label*="close"], .modal-close');
          if (closeButton instanceof HTMLElement) {
            closeButton.click();
          }
        }
      }

      // Tab trap em modais
      if (e.key === 'Tab') {
        const activeModal = document.querySelector('[role="dialog"][aria-modal="true"]');
        if (activeModal) {
          const focusableElements = activeModal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const value: AccessibilityContextType = {
    isHighContrast,
    isReducedMotion,
    fontSize,
    announcements,
    toggleHighContrast,
    setFontSize: handleSetFontSize,
    announceToScreenReader,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};

// Componente de controles de acessibilidade
export const AccessibilityControls: React.FC = () => {
  const {
    isHighContrast,
    fontSize,
    toggleHighContrast,
    setFontSize,
  } = useAccessibility();

  return (
    <div className="flex items-center gap-2" role="group" aria-label="Controles de acessibilidade">
      <button
        onClick={toggleHighContrast}
        className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
        aria-label={isHighContrast ? 'Desativar alto contraste' : 'Ativar alto contraste'}
        title={isHighContrast ? 'Desativar alto contraste' : 'Ativar alto contraste'}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      </button>
      
      <select
        value={fontSize}
        onChange={(e) => setFontSize(e.target.value as 'normal' | 'large' | 'extra-large')}
        className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-800 focus-visible:ring-2 focus-visible:ring-blue-500"
        aria-label="Tamanho da fonte"
      >
        <option value="normal">Fonte Normal</option>
        <option value="large">Fonte Grande</option>
        <option value="extra-large">Fonte Extra Grande</option>
      </select>
    </div>
  );
};

export default AccessibilityProvider;