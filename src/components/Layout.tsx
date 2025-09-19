import { ReactNode } from "react";
import { useUiStore } from "@/store/uiStore";
import AuthModal from "./memora/AuthModal";
import GlobalAudioPlayer from "./GlobalAudioPlayer";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { isAuthModalOpen, hideAuthPopup } = useUiStore();

  return (
    <>
      {/* Gradiente de fundo da página */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-gradient-to-br from-[#4D2699] via-[#231733] to-[#160D27]" />
      
      {/* O conteúdo da página atual será renderizado aqui */}
      <div className="min-h-screen flex flex-col relative z-10">
        {children}
      </div>

      {/* Player global persistente */}
      <GlobalAudioPlayer />

      {/* O Modal agora vive aqui, disponível para todas as páginas */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={hideAuthPopup} 
      />
    </>
  );
};

export default Layout;
