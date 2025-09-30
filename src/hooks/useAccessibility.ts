import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Hook para gerenciar foco visível e navegação por teclado
 */
export function useFocusManagement() {
  const [isKeyboardUser, setIsKeyboardUser] = useState(false);
  const [focusedElement, setFocusedElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setIsKeyboardUser(true);
        document.body.classList.add('keyboard-user');
      }
    };

    const handleMouseDown = () => {
      setIsKeyboardUser(false);
      document.body.classList.remove('keyboard-user');
    };

    const handleFocus = (e: FocusEvent) => {
      if (isKeyboardUser) {
        setFocusedElement(e.target as HTMLElement);
      }
    };

    const handleBlur = () => {
      setFocusedElement(null);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('focus', handleFocus, true);
    document.addEventListener('blur', handleBlur, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('focus', handleFocus, true);
      document.removeEventListener('blur', handleBlur, true);
    };
  }, [isKeyboardUser]);

  return {
    isKeyboardUser,
    focusedElement,
    setKeyboardUser: setIsKeyboardUser
  };
}

/**
 * Hook para navegação por teclado em listas e grids
 */
export function useKeyboardNavigation({
  containerRef,
  itemSelector = '[data-keyboard-nav]',
  orientation = 'both', // 'horizontal', 'vertical', 'both'
  loop = true,
  autoFocus = false
}: {
  containerRef: React.RefObject<HTMLElement>;
  itemSelector?: string;
  orientation?: 'horizontal' | 'vertical' | 'both';
  loop?: boolean;
  autoFocus?: boolean;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [items, setItems] = useState<HTMLElement[]>([]);

  const updateItems = useCallback(() => {
    if (containerRef.current) {
      const newItems = Array.from(
        containerRef.current.querySelectorAll(itemSelector)
      ) as HTMLElement[];
      setItems(newItems);
      return newItems;
    }
    return [];
  }, [containerRef, itemSelector]);

  const focusItem = useCallback((index: number) => {
    const currentItems = items.length > 0 ? items : updateItems();
    if (currentItems[index]) {
      currentItems[index].focus();
      setCurrentIndex(index);
    }
  }, [items, updateItems]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const currentItems = items.length > 0 ? items : updateItems();
    if (currentItems.length === 0) return;

    let newIndex = currentIndex;
    let handled = false;

    switch (e.key) {
      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'both') {
          newIndex = currentIndex + 1;
          handled = true;
        }
        break;
      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'both') {
          newIndex = currentIndex - 1;
          handled = true;
        }
        break;
      case 'ArrowDown':
        if (orientation === 'vertical' || orientation === 'both') {
          newIndex = currentIndex + 1;
          handled = true;
        }
        break;
      case 'ArrowUp':
        if (orientation === 'vertical' || orientation === 'both') {
          newIndex = currentIndex - 1;
          handled = true;
        }
        break;
      case 'Home':
        newIndex = 0;
        handled = true;
        break;
      case 'End':
        newIndex = currentItems.length - 1;
        handled = true;
        break;
    }

    if (handled) {
      e.preventDefault();
      
      // Handle looping
      if (loop) {
        if (newIndex < 0) newIndex = currentItems.length - 1;
        if (newIndex >= currentItems.length) newIndex = 0;
      } else {
        newIndex = Math.max(0, Math.min(newIndex, currentItems.length - 1));
      }
      
      focusItem(newIndex);
    }
  }, [currentIndex, items, orientation, loop, updateItems, focusItem]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    updateItems();
    
    if (autoFocus && items.length > 0) {
      focusItem(0);
    }

    container.addEventListener('keydown', handleKeyDown);
    
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [containerRef, handleKeyDown, autoFocus, items.length, focusItem, updateItems]);

  return {
    currentIndex,
    items,
    focusItem,
    updateItems
  };
}

/**
 * Hook para gerenciar contraste e temas de acessibilidade
 */
export function useContrastMode() {
  const [highContrast, setHighContrast] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('high-contrast') === 'true' ||
             window.matchMedia('(prefers-contrast: high)').matches;
    }
    return false;
  });

  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('reduced-motion') === 'true' ||
             window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  const toggleHighContrast = useCallback(() => {
    const newValue = !highContrast;
    setHighContrast(newValue);
    localStorage.setItem('high-contrast', newValue.toString());
    
    if (newValue) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [highContrast]);

  const toggleReducedMotion = useCallback(() => {
    const newValue = !reducedMotion;
    setReducedMotion(newValue);
    localStorage.setItem('reduced-motion', newValue.toString());
    
    if (newValue) {
      document.documentElement.classList.add('reduced-motion');
    } else {
      document.documentElement.classList.remove('reduced-motion');
    }
  }, [reducedMotion]);

  useEffect(() => {
    // Aplicar classes iniciais
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    }
    if (reducedMotion) {
      document.documentElement.classList.add('reduced-motion');
    }

    // Escutar mudanças nas preferências do sistema
    const contrastMediaQuery = window.matchMedia('(prefers-contrast: high)');
    const motionMediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleContrastChange = (e: MediaQueryListEvent) => {
      if (localStorage.getItem('high-contrast') === null) {
        setHighContrast(e.matches);
        if (e.matches) {
          document.documentElement.classList.add('high-contrast');
        } else {
          document.documentElement.classList.remove('high-contrast');
        }
      }
    };

    const handleMotionChange = (e: MediaQueryListEvent) => {
      if (localStorage.getItem('reduced-motion') === null) {
        setReducedMotion(e.matches);
        if (e.matches) {
          document.documentElement.classList.add('reduced-motion');
        } else {
          document.documentElement.classList.remove('reduced-motion');
        }
      }
    };

    contrastMediaQuery.addEventListener('change', handleContrastChange);
    motionMediaQuery.addEventListener('change', handleMotionChange);

    return () => {
      contrastMediaQuery.removeEventListener('change', handleContrastChange);
      motionMediaQuery.removeEventListener('change', handleMotionChange);
    };
  }, [highContrast, reducedMotion]);

  return {
    highContrast,
    reducedMotion,
    toggleHighContrast,
    toggleReducedMotion
  };
}

/**
 * Hook para anúncios de screen reader
 */
export function useScreenReader() {
  const announceRef = useRef<HTMLDivElement>(null);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (announceRef.current) {
      announceRef.current.setAttribute('aria-live', priority);
      announceRef.current.textContent = message;
      
      // Limpar após um tempo para permitir novos anúncios
      setTimeout(() => {
        if (announceRef.current) {
          announceRef.current.textContent = '';
        }
      }, 1000);
    }
  }, []);

  const createAnnouncer = useCallback(() => {
    return (
      <div
        ref={announceRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        role="status"
      />
    );
  }, []);

  return {
    announce,
    createAnnouncer
  };
}

/**
 * Hook para validação de acessibilidade
 */
export function useAccessibilityValidation() {
  const validateElement = useCallback((element: HTMLElement) => {
    const issues: string[] = [];

    // Verificar se elementos interativos têm labels
    if (['button', 'input', 'select', 'textarea'].includes(element.tagName.toLowerCase())) {
      const hasLabel = element.getAttribute('aria-label') ||
                      element.getAttribute('aria-labelledby') ||
                      element.querySelector('label');
      
      if (!hasLabel) {
        issues.push('Elemento interativo sem label acessível');
      }
    }

    // Verificar contraste de cores (simplificado)
    const styles = window.getComputedStyle(element);
    const backgroundColor = styles.backgroundColor;
    const color = styles.color;
    
    if (backgroundColor !== 'rgba(0, 0, 0, 0)' && color !== 'rgba(0, 0, 0, 0)') {
      // Aqui seria implementada uma verificação real de contraste
      // Por simplicidade, apenas verificamos se as cores são diferentes
      if (backgroundColor === color) {
        issues.push('Contraste insuficiente entre texto e fundo');
      }
    }

    // Verificar se imagens têm alt text
    if (element.tagName.toLowerCase() === 'img') {
      const altText = element.getAttribute('alt');
      if (altText === null || altText === '') {
        issues.push('Imagem sem texto alternativo');
      }
    }

    return issues;
  }, []);

  const validatePage = useCallback(() => {
    const allIssues: { element: HTMLElement; issues: string[] }[] = [];
    const interactiveElements = document.querySelectorAll(
      'button, input, select, textarea, a, img, [tabindex]'
    );

    interactiveElements.forEach((element) => {
      const issues = validateElement(element as HTMLElement);
      if (issues.length > 0) {
        allIssues.push({ element: element as HTMLElement, issues });
      }
    });

    return allIssues;
  }, [validateElement]);

  return {
    validateElement,
    validatePage
  };
}

/**
 * Hook para trap de foco em modais
 */
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Salvar o foco anterior
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Focar no primeiro elemento
    if (firstElement) {
      firstElement.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }

      if (e.key === 'Escape') {
        // Permitir que o componente pai lide com o Escape
        e.stopPropagation();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      
      // Restaurar o foco anterior
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [isActive]);

  return containerRef;
}