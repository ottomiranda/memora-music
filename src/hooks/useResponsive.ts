import { useState, useEffect, useCallback } from 'react';

// Breakpoints baseados no tailwind.config.ts
const BREAKPOINTS = {
  xs: 375,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

type Breakpoint = keyof typeof BREAKPOINTS;

interface ResponsiveState {
  width: number;
  height: number;
  breakpoint: Breakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isXs: boolean;
  isSm: boolean;
  isMd: boolean;
  isLg: boolean;
  isXl: boolean;
  is2xl: boolean;
}

// Função para debounce
function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      const newTimer = setTimeout(() => {
        callback(...args);
      }, delay);

      setDebounceTimer(newTimer);
    },
    [callback, delay, debounceTimer]
  ) as T;

  return debouncedCallback;
}

// Função para determinar o breakpoint atual
function getCurrentBreakpoint(width: number): Breakpoint {
  if (width >= BREAKPOINTS['2xl']) return '2xl';
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  if (width >= BREAKPOINTS.sm) return 'sm';
  return 'xs';
}

// Função para criar o estado responsivo
function createResponsiveState(width: number, height: number): ResponsiveState {
  const breakpoint = getCurrentBreakpoint(width);
  
  return {
    width,
    height,
    breakpoint,
    isMobile: width < BREAKPOINTS.md, // < 768px
    isTablet: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg, // 768px - 1023px
    isDesktop: width >= BREAKPOINTS.lg, // >= 1024px
    isXs: width < BREAKPOINTS.sm, // < 640px
    isSm: width >= BREAKPOINTS.sm && width < BREAKPOINTS.md, // 640px - 767px
    isMd: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg, // 768px - 1023px
    isLg: width >= BREAKPOINTS.lg && width < BREAKPOINTS.xl, // 1024px - 1279px
    isXl: width >= BREAKPOINTS.xl && width < BREAKPOINTS['2xl'], // 1280px - 1535px
    is2xl: width >= BREAKPOINTS['2xl'], // >= 1536px
  };
}

/**
 * Hook avançado para detecção responsiva com múltiplos breakpoints
 * 
 * @param debounceMs - Tempo de debounce em milissegundos (padrão: 150ms)
 * @returns Estado responsivo completo com breakpoints e flags de dispositivo
 * 
 * @example
 * ```tsx
 * const { isMobile, isTablet, breakpoint, width } = useResponsive();
 * 
 * if (isMobile) {
 *   return <MobileLayout />;
 * }
 * 
 * if (breakpoint === 'lg') {
 *   return <DesktopLayout />;
 * }
 * ```
 */
export function useResponsive(debounceMs: number = 150): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>(() => {
    // Estado inicial para SSR
    if (typeof window === 'undefined') {
      return createResponsiveState(1024, 768); // Padrão desktop para SSR
    }
    return createResponsiveState(window.innerWidth, window.innerHeight);
  });

  const updateState = useCallback(() => {
    if (typeof window !== 'undefined') {
      setState(createResponsiveState(window.innerWidth, window.innerHeight));
    }
  }, []);

  const debouncedUpdateState = useDebounce(updateState, debounceMs);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Atualização inicial
    updateState();

    // Event listener para resize
    window.addEventListener('resize', debouncedUpdateState);
    
    // Event listener para orientação (dispositivos móveis)
    window.addEventListener('orientationchange', debouncedUpdateState);

    return () => {
      window.removeEventListener('resize', debouncedUpdateState);
      window.removeEventListener('orientationchange', debouncedUpdateState);
    };
  }, [debouncedUpdateState, updateState]);

  return state;
}

/**
 * Hook simplificado para detecção de mobile (compatibilidade com useIsMobile)
 * 
 * @returns boolean indicando se é dispositivo móvel (< 768px)
 */
export function useIsMobile(): boolean {
  const { isMobile } = useResponsive();
  return isMobile;
}

/**
 * Hook para verificar se está em um breakpoint específico ou maior
 * 
 * @param breakpoint - Breakpoint mínimo a verificar
 * @returns boolean indicando se a tela é maior ou igual ao breakpoint
 * 
 * @example
 * ```tsx
 * const isLargeScreen = useBreakpoint('lg'); // true se >= 1024px
 * ```
 */
export function useBreakpoint(breakpoint: Breakpoint): boolean {
  const { width } = useResponsive();
  return width >= BREAKPOINTS[breakpoint];
}

/**
 * Exporta os breakpoints para uso em outros lugares
 */
export { BREAKPOINTS };
export type { Breakpoint, ResponsiveState };