import { useEffect, useRef, useState } from 'react';

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

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Se já foi carregado, não precisa observar novamente
    if (hasLoaded) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          setHasLoaded(true);
          // Para de observar após o primeiro carregamento
          observer.unobserve(element);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [hasLoaded, options]);

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

  useEffect(() => {
    if (!isVisible || !src) return;

    const img = new Image();
    
    img.onload = () => {
      setImageSrc(src);
      setIsLoaded(true);
      setHasError(false);
    };
    
    img.onerror = () => {
      setHasError(true);
      setIsLoaded(false);
    };
    
    img.src = src;
  }, [isVisible, src]);

  return [ref, imageSrc, isLoaded, hasError];
}

/**
 * Componente wrapper para lazy loading
 */
interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
  options?: IntersectionObserverInit;
}

export function LazyWrapper({ 
  children, 
  fallback = null, 
  className = '', 
  options = {} 
}: LazyWrapperProps) {
  const [ref, isVisible] = useLazyLoading(options);

  return (
    <div ref={ref} className={className}>
      {isVisible ? children : fallback}
    </div>
  );
}

/**
 * Componente de imagem com lazy loading
 */
interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallback?: React.ReactNode;
  options?: IntersectionObserverInit;
}

export function LazyImage({ 
  src, 
  alt, 
  fallback, 
  className = '', 
  options = {},
  ...props 
}: LazyImageProps) {
  const [ref, imageSrc, isLoaded, hasError] = useLazyImage(src, options);

  if (hasError && fallback) {
    return <>{fallback}</>;
  }

  return (
    <img
      ref={ref}
      src={imageSrc}
      alt={alt}
      className={`transition-opacity duration-300 ${
        isLoaded ? 'opacity-100' : 'opacity-0'
      } ${className}`}
      loading="lazy"
      {...props}
    />
  );
}