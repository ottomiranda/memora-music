import React, { useMemo } from 'react';
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { v4 as uuidv4 } from 'uuid';
import Navbar from "./components/memora/Navbar";
import Footer from "./components/memora/Footer";
import Layout from "./components/Layout";
import PaymentModal from "./components/PaymentModal";
import Index from "./pages/Index";
import Criar from "./pages/Criar";
import MinhasMusicas from "./pages/MinhasMusicas";
import MusicaPublica from "./pages/MusicaPublica";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";
import TermosDeUso from "./pages/TermosDeUso";
import PoliticaDePrivacidade from "./pages/PoliticaDePrivacidade";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { useScrollToTop } from "./hooks/useScrollToTop";
import { useUiStore } from "./store/uiStore";
import { NAVBAR_TOTAL_OFFSET } from "./constants/layout";
import { useAuthStore } from "./store/authStore";
import { useLocalizedRoutes } from '@/hooks/useLocalizedRoutes';
import { getLegacyPaths } from '@/routes/paths';
import LegacyRouteRedirect from '@/components/routing/LegacyRouteRedirect';
import { PerformanceOptimizer } from '@/components/performance/PerformanceOptimizer';
import { AccessibilityProvider } from '@/components/accessibility/AccessibilityProvider';
import { ScreenReaderAnnouncer } from '@/components/accessibility/ScreenReaderAnnouncer';
import { SkipToMainContent, SkipToNavigation } from '@/components/accessibility/SkipLink';
// Gerar e persistir deviceId único
let deviceId = localStorage.getItem('deviceId');
if (!deviceId) {
  deviceId = uuidv4();
  localStorage.setItem('deviceId', deviceId);
  console.log('[DeviceFingerprint] Novo deviceId gerado:', deviceId);
} else {
  console.log('[DeviceFingerprint] DeviceId existente carregado:', deviceId);
}

const queryClient = new QueryClient();

// Componente para forçar a hidratação do authStore
const AuthInitializer = () => {
  console.log('[AuthInitializer] *** COMPONENTE RENDERIZADO ***');
  
  const authStore = useAuthStore();
  
  console.log('[AuthInitializer] Store acessado:', {
    isLoading: authStore.isLoading,
    isLoggedIn: authStore.isLoggedIn,
    hasUser: !!authStore.user
  });
  
  // Forçar a rehydratação se ainda estiver carregando
  React.useEffect(() => {
    console.log('[AuthInitializer] useEffect executado');
    if (authStore.isLoading) {
      console.log('[AuthInitializer] Ainda carregando, forçando rehydratação...');
      // Forçar a hidratação manualmente
      useAuthStore.persist.rehydrate();
    }
  }, [authStore.isLoading]);
  
  return null;
};

// Componente interno que usa o hook de scroll
const AppContent = () => {
  useScrollToTop(); // Hook que faz scroll para o topo em mudanças de rota
  const { isPaymentPopupVisible, hidePaymentPopup, handleUpgrade } = useUiStore();
  const { localizedPaths, language } = useLocalizedRoutes();
  const legacyRoutes = useMemo(() => getLegacyPaths(language), [language]);
  
  return (
    <AccessibilityProvider>
      <Layout>
        <AuthInitializer />
        {/* Links para pular conteúdo - aparecem apenas no foco do teclado */}
        <SkipToMainContent />
        <SkipToNavigation />
        
        {/* Cabeçalho com navegação */}
        <header role="banner">
          <Navbar id="navigation" />
        </header>
        
        {/* Conteúdo principal */}
        <main id="main-content" className="flex-1 w-full" role="main" tabIndex={-1}>
          <Routes>
          <Route path={localizedPaths.home} element={<Index />} />
          <Route path={localizedPaths.create} element={<Criar />} />
          <Route 
            path={localizedPaths.myMusic}
            element={
              <ProtectedRoute>
                <MinhasMusicas />
              </ProtectedRoute>
            } 
          />
          <Route path={localizedPaths.publicMusic} element={<MusicaPublica />} />
          <Route path={localizedPaths.authCallback} element={<AuthCallback />} />
          <Route path={localizedPaths.termsOfUse} element={<TermosDeUso />} />
          <Route path={localizedPaths.privacyPolicy} element={<PoliticaDePrivacidade />} />
          {legacyRoutes.map(({ key, path }) => (
            <Route key={`legacy-${path}`} path={path} element={<LegacyRouteRedirect routeKey={key} />} />
          ))}
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        
        {/* Rodapé */}
        <Footer />
        
        {/* Componentes de acessibilidade */}
        <ScreenReaderAnnouncer />
        
        {/* Payment Modal */}
        <PaymentModal 
          isOpen={isPaymentPopupVisible} 
          onClose={hidePaymentPopup}
          onConfirm={handleUpgrade}
        />
      </Layout>
    </AccessibilityProvider>
  );
};

// Expor authStore no window para facilitar testes
if (typeof window !== 'undefined') {
  (window as any).useAuthStore = useAuthStore;
}

const App = () => (
  <PerformanceOptimizer enableLogging={process.env.NODE_ENV === 'development'} reportToAnalytics={true}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </PerformanceOptimizer>
);

export default App;
