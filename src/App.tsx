import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ToastContainer } from "@/components/ui/toast";
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
import NotFound from "./pages/NotFound";
import { useScrollToTop } from "./hooks/useScrollToTop";
import { useUiStore } from "./store/uiStore";

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

// Componente interno que usa o hook de scroll
const AppContent = () => {
  useScrollToTop(); // Hook que faz scroll para o topo em mudanças de rota
  const { isPaymentPopupVisible, hidePaymentPopup, handleUpgrade } = useUiStore();
  
  return (
    <Layout>
      <Navbar />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/criar" element={<Criar />} />
        <Route path="/minhas-musicas" element={<MinhasMusicas />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
      
      {/* Payment Modal */}
      <PaymentModal 
        isOpen={isPaymentPopupVisible} 
        onClose={hidePaymentPopup}
        onConfirm={handleUpgrade}
      />
    </Layout>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ToastContainer />
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
);

export default App;
