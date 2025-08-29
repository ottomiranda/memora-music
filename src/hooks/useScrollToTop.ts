import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook personalizado que automaticamente faz scroll para o topo da página
 * sempre que a rota muda. Garante uma experiência de navegação consistente.
 */
export const useScrollToTop = () => {
  const location = useLocation();

  useEffect(() => {
    // Scroll para o topo da página de forma suave e instantânea
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' // Usar 'instant' para scroll imediato
    });
  }, [location.pathname]); // Executa sempre que a rota (pathname) muda
};

export default useScrollToTop;