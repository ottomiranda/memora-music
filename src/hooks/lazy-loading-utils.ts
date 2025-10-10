import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Hook para implementar lazy loading com Intersection Observer
 * @param options - Opções do Intersection Observer
 * @returns [ref, isVisible, hasLoaded] - Ref para o elemento, se está visível e se já foi carregado
 */
export function useLazyLoading<T extends Element = HTMLDivElement>(
  options: IntersectionObserverInit = {}
): [React.RefObject<T>, boolean, boolean] {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const elementRef = useRef<T>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Memoize a função de callback do observer para evitar recriações
  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    if (entry?.isIntersecting) {
      setIsVisible(true);
      setHasLoaded(true);
      // Para de observar após o primeiro carregamento
      if (elementRef.current && observerRef.current) {
        observerRef.current.unobserve(elementRef.current);
      }
    }
  }, []);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || hasLoaded) return;

    // Cleanup observer anterior se existir
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Criar novo observer com opções atualizadas
    observerRef.current = new IntersectionObserver(handleIntersection, {
      threshold: 0.1,
      rootMargin: '50px',
      ...options,
    });

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasLoaded, options, handleIntersection]);

  return [elementRef, isVisible, hasLoaded];
}

/**
 * Hook específico para lazy loading de imagens
 * @param src - URL da imagem
 * @param options - Opções do Intersection Observer
 * @returns [ref, imageSrc, isLoaded, error] - Ref, src da imagem, se carregou e erro
 */
export function useLazyImage(
  src: string,
  options: IntersectionObserverInit = {}
): [React.RefObject<HTMLImageElement>, string, boolean, boolean] {
  const [imageSrc, setImageSrc] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [ref, isVisible] = useLazyLoading<HTMLImageElement>(options);

  // Memoize handlers de imagem para evitar recriações
  const handleImageLoad = useCallback(() => {
    setImageSrc(src);
    setIsLoaded(true);
    setHasError(false);
  }, [src]);

  const handleImageError = useCallback(() => {
    setHasError(true);
    setIsLoaded(false);
  }, []);

  useEffect(() => {
    if (!isVisible || !src) return;

    const img = new Image();
    img.onload = handleImageLoad;
    img.onerror = handleImageError;
    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [isVisible, src, handleImageLoad, handleImageError]);

  return [ref, imageSrc, isLoaded, hasError];
}