import { ReactNode, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import { useNavigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

/**
 * Componente para proteger rotas que requerem autenticação
 * Redireciona usuários não autenticados para a página inicial e mostra modal de login
 */
const ProtectedRoute = ({ children, redirectTo = '/' }: ProtectedRouteProps) => {
  const { isLoggedIn, isLoading } = useAuthStore();
  const { showAuthPopup } = useUiStore();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('[ProtectedRoute] Estado atual:', { isLoggedIn, isLoading });
    
    // Só redirecionar se não estiver carregando E não estiver logado
    if (!isLoading && !isLoggedIn) {
      console.log('[ProtectedRoute] Usuário não autenticado - redirecionando');
      
      // Redirecionar para a página especificada
      navigate(redirectTo, { replace: true });
      
      // Mostrar modal de autenticação com callback para retornar à rota protegida
      showAuthPopup(() => {
        // Após login bem-sucedido, navegar de volta para a rota protegida
        navigate(window.location.pathname);
      });
    }
  }, [isLoggedIn, isLoading, navigate, redirectTo, showAuthPopup]);

  // CRÍTICO: Mostrar loading enquanto verifica autenticação
  // Isso impede que o conteúdo seja renderizado antes da verificação completa
  if (isLoading) {
    console.log('[ProtectedRoute] Ainda carregando - mostrando spinner');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-memora-primary"></div>
      </div>
    );
  }

  // CRÍTICO: Se não estiver logado após o carregamento, não renderizar NADA
  if (!isLoggedIn) {
    console.log('[ProtectedRoute] Usuário não autenticado após carregamento - bloqueando acesso');
    return null;
  }

  console.log('[ProtectedRoute] Usuário autenticado - permitindo acesso');
  return <>{children}</>;
};

export default ProtectedRoute;