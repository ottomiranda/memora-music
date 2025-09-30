import { useEffect, useCallback, useRef } from 'react';

// Interfaces para métricas Web Vitals
interface WebVitalMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

interface WebVitalsConfig {
  reportWebVitals?: (metric: WebVitalMetric) => void;
  enableLogging?: boolean;
  thresholds?: {
    lcp?: { good: number; poor: number };
    fid?: { good: number; poor: number };
    cls?: { good: number; poor: number };
  };
}

// Thresholds padrão do Google
const DEFAULT_THRESHOLDS = {
  lcp: { good: 2500, poor: 4000 },
  fid: { good: 100, poor: 300 },
  cls: { good: 0.1, poor: 0.25 }
};

// Hook para monitoramento de Web Vitals
export function useWebVitals(config: WebVitalsConfig = {}) {
  const {
    reportWebVitals,
    enableLogging = false,
    thresholds = DEFAULT_THRESHOLDS
  } = config;

  const metricsRef = useRef<Map<string, WebVitalMetric>>(new Map());
  const observersRef = useRef<PerformanceObserver[]>([]);

  // Função para calcular rating baseado nos thresholds
  const calculateRating = useCallback((name: string, value: number): 'good' | 'needs-improvement' | 'poor' => {
    const threshold = thresholds[name.toLowerCase() as keyof typeof thresholds];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }, [thresholds]);

  // Função para reportar métrica
  const reportMetric = useCallback((metric: WebVitalMetric) => {
    metricsRef.current.set(metric.name, metric);
    
    if (enableLogging) {
      console.log(`[Web Vitals] ${metric.name}:`, {
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta
      });
    }

    if (reportWebVitals) {
      reportWebVitals(metric);
    }
  }, [reportWebVitals, enableLogging]);

  // Observer para LCP (Largest Contentful Paint)
  const observeLCP = useCallback(() => {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & { renderTime?: number; loadTime?: number };
        
        if (lastEntry) {
          const value = lastEntry.renderTime || lastEntry.loadTime || lastEntry.startTime;
          const metric: WebVitalMetric = {
            name: 'LCP',
            value: Math.round(value),
            rating: calculateRating('lcp', value),
            delta: 0,
            id: `lcp-${Date.now()}`
          };
          
          const previous = metricsRef.current.get('LCP');
          if (previous) {
            metric.delta = metric.value - previous.value;
          }
          
          reportMetric(metric);
        }
      });

      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      observersRef.current.push(observer);
    } catch (error) {
      console.warn('[Web Vitals] LCP observation failed:', error);
    }
  }, [calculateRating, reportMetric]);

  // Observer para FID (First Input Delay)
  const observeFID = useCallback(() => {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const fidEntry = entry as PerformanceEntry & { processingStart?: number };
          if (fidEntry.processingStart) {
            const value = fidEntry.processingStart - entry.startTime;
            const metric: WebVitalMetric = {
              name: 'FID',
              value: Math.round(value),
              rating: calculateRating('fid', value),
              delta: 0,
              id: `fid-${Date.now()}`
            };
            
            const previous = metricsRef.current.get('FID');
            if (previous) {
              metric.delta = metric.value - previous.value;
            }
            
            reportMetric(metric);
          }
        });
      });

      observer.observe({ entryTypes: ['first-input'] });
      observersRef.current.push(observer);
    } catch (error) {
      console.warn('[Web Vitals] FID observation failed:', error);
    }
  }, [calculateRating, reportMetric]);

  // Observer para CLS (Cumulative Layout Shift)
  const observeCLS = useCallback(() => {
    if (!('PerformanceObserver' in window)) return;

    let clsValue = 0;
    let sessionValue = 0;
    let sessionEntries: PerformanceEntry[] = [];

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach((entry) => {
          const layoutShiftEntry = entry as PerformanceEntry & { value?: number; hadRecentInput?: boolean };
          
          if (!layoutShiftEntry.hadRecentInput && layoutShiftEntry.value) {
            sessionValue += layoutShiftEntry.value;
            sessionEntries.push(entry);
            
            // Calcula CLS baseado na sessão atual
            if (sessionValue > clsValue) {
              clsValue = sessionValue;
              
              const metric: WebVitalMetric = {
                name: 'CLS',
                value: Math.round(clsValue * 1000) / 1000, // Arredonda para 3 casas decimais
                rating: calculateRating('cls', clsValue),
                delta: 0,
                id: `cls-${Date.now()}`
              };
              
              const previous = metricsRef.current.get('CLS');
              if (previous) {
                metric.delta = metric.value - previous.value;
              }
              
              reportMetric(metric);
            }
          }
        });
      });

      observer.observe({ entryTypes: ['layout-shift'] });
      observersRef.current.push(observer);
    } catch (error) {
      console.warn('[Web Vitals] CLS observation failed:', error);
    }
  }, [calculateRating, reportMetric]);

  // Função para obter todas as métricas coletadas
  const getMetrics = useCallback(() => {
    return Array.from(metricsRef.current.values());
  }, []);

  // Função para obter uma métrica específica
  const getMetric = useCallback((name: string) => {
    return metricsRef.current.get(name) || null;
  }, []);

  // Função para limpar observers
  const cleanup = useCallback(() => {
    observersRef.current.forEach(observer => {
      try {
        observer.disconnect();
      } catch (error) {
        console.warn('[Web Vitals] Error disconnecting observer:', error);
      }
    });
    observersRef.current = [];
  }, []);

  // Inicializa os observers
  useEffect(() => {
    // Aguarda o DOM estar pronto
    const initObservers = () => {
      observeLCP();
      observeFID();
      observeCLS();
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initObservers);
    } else {
      initObservers();
    }

    // Cleanup na desmontagem
    return cleanup;
  }, [observeLCP, observeFID, observeCLS, cleanup]);

  return {
    getMetrics,
    getMetric,
    cleanup
  };
}

// Hook para otimizações específicas de performance
export function usePerformanceOptimizations() {
  const preloadedResources = useRef<Set<string>>(new Set());

  // Função para preload de recursos críticos
  const preloadResource = useCallback((href: string, as: string, type?: string) => {
    if (preloadedResources.current.has(href)) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    if (type) link.type = type;

    document.head.appendChild(link);
    preloadedResources.current.add(href);
  }, []);

  // Função para prefetch de recursos
  const prefetchResource = useCallback((href: string) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
  }, []);

  // Função para otimizar imagens com lazy loading
  const optimizeImage = useCallback((img: HTMLImageElement) => {
    if ('loading' in img) {
      img.loading = 'lazy';
    }
    
    // Adiciona decode async para melhor performance
    img.decoding = 'async';
    
    // Adiciona sizes responsivo se não existir
    if (!img.sizes && img.srcset) {
      img.sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw';
    }
  }, []);

  // Função para reduzir CLS com placeholders
  const addImagePlaceholder = useCallback((img: HTMLImageElement, aspectRatio: number) => {
    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    wrapper.style.width = '100%';
    wrapper.style.paddingBottom = `${(1 / aspectRatio) * 100}%`;
    
    img.style.position = 'absolute';
    img.style.top = '0';
    img.style.left = '0';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    
    if (img.parentNode) {
      img.parentNode.insertBefore(wrapper, img);
      wrapper.appendChild(img);
    }
  }, []);

  return {
    preloadResource,
    prefetchResource,
    optimizeImage,
    addImagePlaceholder
  };
}

// Hook combinado para otimização de Web Vitals
export function useWebVitalsOptimization(config: WebVitalsConfig & {
  enableOptimizations?: boolean;
} = {}) {
  const { enableOptimizations = true, ...webVitalsConfig } = config;
  
  const webVitals = useWebVitals(webVitalsConfig);
  const optimizations = usePerformanceOptimizations();

  // Aplica otimizações automáticas se habilitado
  useEffect(() => {
    if (!enableOptimizations) return;

    // Otimiza todas as imagens existentes
    const images = document.querySelectorAll('img');
    images.forEach((img) => {
      optimizations.optimizeImage(img as HTMLImageElement);
    });

    // Observer para novas imagens
    const imageObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            const images = element.tagName === 'IMG' 
              ? [element as HTMLImageElement]
              : Array.from(element.querySelectorAll('img'));
            
            images.forEach((img) => {
              optimizations.optimizeImage(img);
            });
          }
        });
      });
    });

    imageObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => {
      imageObserver.disconnect();
    };
  }, [enableOptimizations, optimizations]);

  return {
    ...webVitals,
    ...optimizations
  };
}