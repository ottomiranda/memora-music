import { ReactNode } from "react";
import { useUiStore } from "@/store/uiStore";
import AuthModal from "./memora/AuthModal";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { isAuthModalOpen, hideAuthPopup } = useUiStore();

  return (
    <>
      {/* O conteúdo da página atual será renderizado aqui */}
      {children}

      {/* O Modal agora vive aqui, disponível para todas as páginas */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={hideAuthPopup} 
      />
    </>
  );
};

export default Layout;