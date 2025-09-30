import React, { useEffect } from 'react';
import { useWebVitalsOptimization } from '@/hooks/useWebVitals';

interface PerformanceOptimizerProps {
  children: React.ReactNode;
  enableLogging?: boolean;
  reportToAnalytics?: boolean;
}

/**
 * Componente para otimizar performance e Core Web Vitals
 * Deve ser usado no nível mais alto da aplicação
 */
export function PerformanceOptimizer({ 
  children, 
  enableLogging = false, 
  reportToAnalytics = false 
}: PerformanceOptimizerProps) {
  // Configurar Web Vitals
  useWebVitalsOptimization({
    enableLogging,
    reportWebVitals: reportToAnalytics ? (metric) => {
      // Enviar métricas para analytics (Google Analytics, etc.)
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', metric.name, {
          event_category: 'Web Vitals',
          value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
          event_label: metric.id,
          non_interaction: true,
        });
      }
    } : undefined
  });

  useEffect(() => {
    // Otimizações gerais de performance
    const optimizePerformance = () => {
      // 1. Preload de recursos críticos
      const preloadCriticalResources = () => {
        // Preload de fontes críticas
        const criticalFonts = [
          '/fonts/inter-var.woff2',
          '/fonts/heading-font.woff2'
        ];
        
        criticalFonts.forEach(fontUrl => {
          const link = document.createElement('link');
          link.rel = 'preload';
          link.as = 'font';
          link.type = 'font/woff2';
          link.crossOrigin = 'anonymous';
          link.href = fontUrl;
          document.head.appendChild(link);
        });
      };

      // 2. Otimizar imagens
      const optimizeImages = () => {
        const images = document.querySelectorAll('img');
        images.forEach((img) => {
          // Adicionar loading lazy para imagens não críticas
          if (!img.hasAttribute('data-priority')) {
            img.loading = 'lazy';
            img.decoding = 'async';
          }
          
          // Adicionar aspect-ratio para evitar CLS
          if (!img.style.aspectRatio && !img.width && !img.height) {
            img.style.aspectRatio = '16/9';
          }
        });
      };

      // 3. Otimizar event listeners
      const optimizeEventListeners = () => {
        // Usar passive listeners onde possível
        const touchElements = document.querySelectorAll('[data-touch]');
        touchElements.forEach((element) => {
          element.addEventListener('touchstart', () => {}, { passive: true });
          element.addEventListener('touchmove', () => {}, { passive: true });
        });
      };

      // 4. Implementar Resource Hints
      const addResourceHints = () => {
        // DNS prefetch para domínios externos
        const externalDomains = [
          'fonts.googleapis.com',
          'fonts.gstatic.com',
          'api.memora.music'
        ];
        
        externalDomains.forEach(domain => {
          const link = document.createElement('link');
          link.rel = 'dns-prefetch';
          link.href = `//${domain}`;
          document.head.appendChild(link);
        });
      };

      // Executar otimizações
      preloadCriticalResources();
      optimizeImages();
      optimizeEventListeners();
      addResourceHints();
    };

    // Executar otimizações quando o DOM estiver pronto
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', optimizePerformance);
    } else {
      optimizePerformance();
    }

    // Cleanup
    return () => {
      document.removeEventListener('DOMContentLoaded', optimizePerformance);
    };
  }, []);

  return <>{children}</>;
}

/**
 * Hook para marcar elementos críticos para LCP
 */
export function useCriticalResource() {
  return {
    markAsCritical: (element: HTMLElement) => {
      element.setAttribute('data-priority', 'high');
      element.setAttribute('fetchpriority', 'high');
    },
    markAsLazy: (element: HTMLElement) => {
      element.setAttribute('loading', 'lazy');
      element.setAttribute('decoding', 'async');
    }
  };
}

/**
 * Hook para otimizar layout e evitar CLS
 */
export function useLayoutOptimization() {
  return {
    reserveSpace: (element: HTMLElement, dimensions: { width?: string; height?: string; aspectRatio?: string }) => {
      if (dimensions.width) element.style.width = dimensions.width;
      if (dimensions.height) element.style.height = dimensions.height;
      if (dimensions.aspectRatio) element.style.aspectRatio = dimensions.aspectRatio;
      element.setAttribute('data-layout-reserved', 'true');
    },
    markDynamic: (element: HTMLElement, minHeight: string = '100px') => {
      element.style.minHeight = minHeight;
      element.setAttribute('data-dynamic', 'true');
    }
  };
}

/**
 * Componente para otimizar uma seção específica
 */
interface SectionOptimizerProps {
  children: React.ReactNode;
  priority?: 'high' | 'medium' | 'low';
  minHeight?: string;
  className?: string;
}

export function SectionOptimizer({ 
  children, 
  priority = 'medium', 
  minHeight,
  className = '' 
}: SectionOptimizerProps) {
  const sectionRef = React.useRef<HTMLDivElement>(null);
  const { reserveSpace, markDynamic } = useLayoutOptimization();

  useEffect(() => {
    if (sectionRef.current) {
      const element = sectionRef.current;
      
      // Marcar prioridade
      element.setAttribute('data-priority', priority);
      
      // Reservar espaço se especificado
      if (minHeight) {
        markDynamic(element, minHeight);
      }
      
      // Adicionar observador de intersecção para lazy loading
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('section-visible');
              observer.unobserve(entry.target);
            }
          });
        },
        { rootMargin: '50px' }
      );
      
      observer.observe(element);
      
      return () => {
        observer.disconnect();
      };
    }
  }, [priority, minHeight, markDynamic]);

  return (
    <div 
      ref={sectionRef}
      className={`section-optimizer ${className}`}
      style={{ minHeight }}
    >
      {children}
    </div>
  );
}