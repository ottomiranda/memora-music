import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { logger } from '@/lib/logger';

interface PerformanceMetrics {
  ttfb: number;
  fcp: number;
  lcp: number;
  cls: number;
  fid: number;
}

export const PerformanceOptimizer: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    // Registra métricas de performance quando disponíveis
    if ('performance' in window && 'getEntriesByType' in performance) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const metric = {
            name: entry.name,
            value: entry.startTime,
            route: location.pathname
          };

          logger.info({
            msg: 'Performance metric recorded',
            metric
          });
        });
      });

      // Observa métricas web vitais
      observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });

      // Limpa observer quando componente é desmontado
      return () => observer.disconnect();
    }
  }, [location]);

  useEffect(() => {
    // Prefetch de recursos críticos
    const prefetchResources = () => {
      const links = document.querySelectorAll('a[href^="/"]');
      const imageUrls = new Set<string>();

      links.forEach((link) => {
        const href = link.getAttribute('href');
        if (href && !href.includes('#') && href !== location.pathname) {
          const prefetchLink = document.createElement('link');
          prefetchLink.rel = 'prefetch';
          prefetchLink.href = href;
          document.head.appendChild(prefetchLink);
        }

        // Coleta URLs de imagens para prefetch
        link.querySelectorAll('img').forEach((img) => {
          const src = img.getAttribute('src');
          if (src) imageUrls.add(src);
        });
      });

      // Prefetch de imagens críticas
      imageUrls.forEach((url) => {
        const img = new Image();
        img.src = url;
      });
    };

    // Executa prefetch após carregamento inicial
    if (document.readyState === 'complete') {
      prefetchResources();
    } else {
      window.addEventListener('load', prefetchResources);
      return () => window.removeEventListener('load', prefetchResources);
    }
  }, [location]);

  return null;
};
