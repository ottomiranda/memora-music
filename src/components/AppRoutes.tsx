import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useTranslation } from '@/i18n/hooks/useTranslation';
import { useLocalizedRoutes } from '@/hooks/useLocalizedRoutes';
import LegacyRouteRedirect from '@/components/routing/LegacyRouteRedirect';
import { getLegacyPaths } from '@/routes/paths';
import { LoadingScreen } from '@/components/LoadingScreen';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Lazy loading das páginas
const Index = React.lazy(() => import('@/pages/Index'));
const Criar = React.lazy(() => import('@/pages/Criar'));
const MinhasMusicas = React.lazy(() => import('@/pages/MinhasMusicas'));
const MusicaPublica = React.lazy(() => import('@/pages/MusicaPublica'));
const AuthCallback = React.lazy(() => import('@/pages/AuthCallback'));
const TermosDeUso = React.lazy(() => import('@/pages/TermosDeUso'));
const PoliticaPrivacidade = React.lazy(() => import('@/pages/PoliticaPrivacidade'));
const PrivacyPolicy = React.lazy(() => import('@/pages/PrivacyPolicy'));
const NotFound = React.lazy(() => import('@/pages/NotFound'));

const AppRoutes = () => {
  const { language, isReady } = useTranslation();
  const { paths } = useLocalizedRoutes();
  const legacyPaths = getLegacyPaths(language as any);

  // Aguarda o i18n estar pronto antes de renderizar as rotas
  if (!isReady) {
    return <LoadingScreen />;
  }

  return (
    <Layout>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* Rota principal */}
          <Route path={paths.home} element={<Index />} />
          
          {/* Rota de criação - permite acesso sem autenticação (paywall é verificado internamente) */}
          <Route path={paths.create} element={<Criar />} />
          
          {/* Rotas protegidas */}
          <Route 
            path={paths.myMusic} 
            element={
              <ProtectedRoute>
                <MinhasMusicas />
              </ProtectedRoute>
            } 
          />
          
          {/* Rotas públicas */}
          <Route path={paths.publicMusic} element={<MusicaPublica />} />
          <Route path={paths.authCallback} element={<AuthCallback />} />
          
          {/* Páginas legais - suporte para ambos os idiomas */}
          <Route path={paths.termsOfUse} element={<TermosDeUso />} />
          <Route path="/terms-of-use" element={<TermosDeUso />} />
          <Route path={paths.privacyPolicy} element={<PoliticaPrivacidade />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />

          {/* Rotas legadas (de outros idiomas) redirecionadas para a versão atual */}
          {legacyPaths.map(({ key, path }) => (
            <Route key={`legacy-${key}-${path}`} path={path} element={<LegacyRouteRedirect routeKey={key} />} />
          ))}
          
          {/* Fallback para rotas não encontradas */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Layout>
  );
};

export default AppRoutes;