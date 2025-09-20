import { useState, useEffect } from "react";
import { Menu, X, Sparkles } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { useAuthStore } from "../../store/authStore";
import { useUiStore } from "../../store/uiStore";
import { useMusicStore } from "../../store/musicStore";
import { NAVBAR_TOTAL_OFFSET } from "@/constants/layout";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isAtTop = !isScrolled;
  
  // Auth state
  const { isLoggedIn, user, logout } = useAuthStore();
  const { showAuthPopup } = useUiStore();
  const { startNewCreationFlow } = useMusicStore();

  const goToDashboard = () => {
    if (isLoggedIn) {
      navigate('/minhas-musicas');
    } else {
      showAuthPopup(() => navigate('/minhas-musicas'));
    }
    setIsMobileMenuOpen(false);
  };

  const handleCreateMusicClick = async () => {
    const { token } = useAuthStore.getState();
    navigate('/criar');
    await startNewCreationFlow(navigate, token);
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsScrolled(window.scrollY > 50);
  }, [location.pathname]);

  const scrollToSection = (sectionId: string) => {
    // Primeiro tenta encontrar o título específico da seção
    let targetElement = null;
    
    // Busca por um título específico dentro da seção
    const sectionElement = document.getElementById(sectionId);
    if (sectionElement) {
      // Procura por SectionTitle (h2) dentro da seção - prioridade máxima
      const titleElement = sectionElement.querySelector('h2, h1, h3');
      if (titleElement) {
        targetElement = titleElement;
      } else {
        // Fallback para a seção original
        targetElement = sectionElement;
      }
    }
    
    if (targetElement) {
      const elementPosition = targetElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - NAVBAR_TOTAL_OFFSET;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
    setIsMobileMenuOpen(false);
  };

  const getFirstName = (fullName?: string) => {
    if (!fullName) return '';
    return fullName.split(' ')[0];
  };

  const navVariant = isAtTop ? "liquid-glass--subtle" : "liquid-glass--elevated";

  const desktopNavItemBase = "transition-colors duration-300 font-medium p-0 h-auto";
  const desktopNavItemPalette = isAtTop
    ? "text-white hover:text-memora-secondary focus-visible:text-memora-secondary"
    : "text-[#08060D] hover:text-memora-secondary focus-visible:text-memora-secondary";
  const desktopNavItemClasses = `${desktopNavItemBase} ${desktopNavItemPalette}`;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 liquid-glass ${navVariant}`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/">
              <img 
                src={isAtTop ? "/memora_logo_white.svg" : "/memora_logo.svg"} 
                alt="Memora Music" 
                className="h-9 w-auto cursor-pointer"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Button
              onClick={() => scrollToSection("como-funciona")}
              variant="ghost"
              className={desktopNavItemClasses}
            >
              Como Funciona
            </Button>
            <Button
              onClick={() => scrollToSection("exemplos")}
              variant="ghost"
              className={desktopNavItemClasses}
            >
              Exemplos
            </Button>
            <Button
              onClick={() => scrollToSection("artistas")}
              variant="ghost"
              className={desktopNavItemClasses}
            >
              Artistas
            </Button>
            <Button
              onClick={() => scrollToSection("precos")}
              variant="ghost"
              className={desktopNavItemClasses}
            >
              Preços
            </Button>
            <Button
              onClick={() => goToDashboard()}
              variant="ghost"
              className={desktopNavItemClasses}
            >
              Minhas Músicas
            </Button>

            {/* Auth Section */}
            <div className="flex items-center gap-4">
              {isLoggedIn ? (
                // --- Estado Logado ---
                <div className="flex items-center gap-4">
                  <span 
                    className={`${isAtTop ? 'text-white' : 'text-[#08060D]'} font-medium transition-colors duration-300`}
                  >
                    Olá, {getFirstName(user?.name) || 'usuário'}!
                  </span>
                  <Button 
                    variant="outline" 
                    onClick={() => logout().catch(console.error)}
                    className={`${isAtTop ? 'border-white text-white hover:bg-white hover:text-memora-primary' : 'border-memora-primary text-memora-primary hover:bg-memora-primary hover:text-white'} transition-all duration-300`}
                  >
                    Sair
                  </Button>
                </div>
              ) : (
                // --- Estado Deslogado ---
                <>
                  <Button 
                    variant="glass"
                    onClick={() => handleCreateMusicClick()}
                    className="flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Crie sua Música
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <Button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              variant="ghost"
              size="icon"
              className={`${isAtTop ? 'text-white hover:text-memora-secondary' : 'text-[#08060D] hover:text-memora-secondary'} transition-colors duration-300`}
              aria-label="Menu de navegação"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden px-4 pb-4">
            <div className="liquid-glass liquid-glass--elevated border border-white/20 rounded-2xl px-2 pt-2 pb-3 space-y-1 shadow-lg">
              <Button
                onClick={() => scrollToSection("como-funciona")}
                variant="ghost"
                className="block w-full text-left px-3 py-2 text-[#08060D] hover:text-memora-secondary hover:bg-gray-100/10 transition-colors duration-300 font-medium h-auto justify-start"
              >
                Como Funciona
              </Button>
              <Button
                onClick={() => scrollToSection("exemplos")}
                variant="ghost"
                className="block w-full text-left px-3 py-2 text-[#08060D] hover:text-memora-secondary hover:bg-gray-100/10 transition-colors duration-300 font-medium h-auto justify-start"
              >
                Exemplos
              </Button>
              <Button
                onClick={() => scrollToSection("artistas")}
                variant="ghost"
                className="block w-full text-left px-3 py-2 text-[#08060D] hover:text-memora-secondary hover:bg-gray-100/10 transition-colors duration-300 font-medium h-auto justify-start"
              >
                Artistas
              </Button>
              <Button
                onClick={() => scrollToSection("precos")}
                variant="ghost"
                className="block w-full text-left px-3 py-2 text-[#08060D] hover:text-memora-secondary hover:bg-gray-100/10 transition-colors duration-300 font-medium h-auto justify-start"
              >
                Preços
              </Button>
              <Button
                onClick={() => goToDashboard()}
                variant="ghost"
                className="block w-full text-left px-3 py-2 text-[#08060D] hover:text-memora-secondary hover:bg-gray-100/10 transition-colors duration-300 font-medium h-auto justify-start"
              >
                Minhas Músicas
              </Button>
              {/* Auth Section Mobile */}
              {isLoggedIn ? (
                // --- Estado Logado Mobile ---
                <div className="mt-2 space-y-2">
                  <div className="px-3 py-2 font-medium text-[#08060D] transition-colors duration-300">
                    Olá, {getFirstName(user?.name) || 'usuário'}!
                  </div>
                  <Button
                    onClick={() => {
                      logout().catch(console.error);
                      setIsMobileMenuOpen(false);
                    }}
                    variant="outline"
                    className="block w-full text-left px-3 py-2 border-memora-primary text-memora-primary hover:bg-memora-primary hover:text-white transition-all duration-300 font-medium"
                  >
                    Sair
                  </Button>
                </div>
              ) : (
                // --- Estado Deslogado Mobile ---
                <div className="mt-2 space-y-2">
                  <Button
                    variant="glass"
                    onClick={() => {
                      handleCreateMusicClick();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Crie sua Música
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
