import { useState, useEffect } from "react";
import { Heart, Menu, X, Moon, Sun } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { useAuthStore } from "../../store/authStore";
import { useUiStore } from "../../store/uiStore";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === '/';
  
  // Auth state
  const { isLoggedIn, user, logout } = useAuthStore();
  const { showAuthPopup, theme, setTheme } = useUiStore();

  const goToDashboard = () => {
    if (isLoggedIn) {
      navigate('/minhas-musicas');
    } else {
      showAuthPopup(() => navigate('/minhas-musicas'));
    }
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMobileMenuOpen(false);
  };

  const getFirstName = (fullName?: string) => {
    if (!fullName) return '';
    return fullName.split(' ')[0];
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 dark:bg-black/50 backdrop-blur-md border-b border-black/5 dark:border-white/10 shadow-lg"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/">
              <img 
                src={isHomePage && !isScrolled ? "/memora_logo_white.svg" : "/memora_logo.svg"} 
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
              className={`${isHomePage && !isScrolled ? 'text-white hover:text-memora-gold' : 'text-memora-gray hover:text-memora-primary'} transition-colors duration-200 font-medium p-0 h-auto`}
            >
              Como Funciona
            </Button>
            <Button
              onClick={() => scrollToSection("exemplos")}
              variant="ghost"
              className={`${isHomePage && !isScrolled ? 'text-white hover:text-memora-gold' : 'text-memora-gray hover:text-memora-primary'} transition-colors duration-200 font-medium p-0 h-auto`}
            >
              Exemplos
            </Button>
            <Button
              onClick={() => scrollToSection("artistas")}
              variant="ghost"
              className={`${isHomePage && !isScrolled ? 'text-white hover:text-memora-gold' : 'text-memora-gray hover:text-memora-primary'} transition-colors duration-200 font-medium p-0 h-auto`}
            >
              Artistas
            </Button>
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`${isHomePage && !isScrolled ? 'text-white hover:text-memora-gold' : 'text-memora-gray hover:text-memora-primary'} transition-colors duration-200`}
              aria-label="Alternar tema"
              title={theme === 'dark' ? 'Mudar para claro' : 'Mudar para escuro'}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Auth Section */}
            <div className="flex items-center gap-4">
              {isLoggedIn ? (
                // --- Estado Logado ---
                <div className="flex items-center gap-4">
                  <span className={`${isHomePage && !isScrolled ? 'text-white' : 'text-memora-gray'} font-medium`}>
                    Olá, {getFirstName(user?.name) || 'usuário'}!
                  </span>
                  <Button 
                    variant="outline" 
                    onClick={() => logout().catch(console.error)}
                    className={`${isHomePage && !isScrolled ? 'border-white text-white hover:bg-white hover:text-memora-primary' : 'border-memora-primary text-memora-primary hover:bg-memora-primary hover:text-white'} transition-all duration-200`}
                  >
                    Sair
                  </Button>
                </div>
              ) : (
                // --- Estado Deslogado ---
                <>

                  <Button 
                    onClick={() => goToDashboard()}
                    className="bg-memora-primary text-white px-6 py-2 rounded-2xl hover:bg-memora-primary/90 transition-all duration-200 font-medium shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                  >
                    Minhas Músicas
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`${isHomePage && !isScrolled ? 'text-white hover:text-memora-gold' : 'text-memora-gray hover:text-memora-primary'} transition-colors duration-200`}
              aria-label="Alternar tema"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <Button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              variant="ghost"
              size="icon"
              className={`${isHomePage && !isScrolled ? 'text-white hover:text-memora-gold' : 'text-memora-gray hover:text-memora-primary'} transition-colors duration-200`}
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
          <div className="md:hidden bg-white/95 backdrop-blur-md border-t border-memora-gray-light">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Button
                onClick={() => scrollToSection("como-funciona")}
                variant="ghost"
                className="block w-full text-left px-3 py-2 text-memora-gray hover:text-memora-primary transition-colors duration-200 font-medium h-auto justify-start"
              >
                Como Funciona
              </Button>
              <Button
                onClick={() => scrollToSection("exemplos")}
                variant="ghost"
                className="block w-full text-left px-3 py-2 text-memora-gray hover:text-memora-primary transition-colors duration-200 font-medium h-auto justify-start"
              >
                Exemplos
              </Button>
              <Button
                onClick={() => scrollToSection("artistas")}
                variant="ghost"
                className="block w-full text-left px-3 py-2 text-memora-gray hover:text-memora-primary transition-colors duration-200 font-medium h-auto justify-start"
              >
                Artistas
              </Button>
              {/* Auth Section Mobile */}
              {isLoggedIn ? (
                // --- Estado Logado Mobile ---
                <div className="mt-2 space-y-2">
                  <div className="px-3 py-2 text-memora-gray font-medium">
                    Olá, {getFirstName(user?.name) || 'usuário'}!
                  </div>
                  <Button
                    onClick={() => {
                      logout().catch(console.error);
                      setIsMobileMenuOpen(false);
                    }}
                    variant="outline"
                    className="block w-full text-left px-3 py-2 border-memora-primary text-memora-primary hover:bg-memora-primary hover:text-white transition-all duration-200 font-medium"
                  >
                    Sair
                  </Button>
                </div>
              ) : (
                // --- Estado Deslogado Mobile ---
                <div className="mt-2 space-y-2">

                  <Button
                    onClick={() => {
                      goToDashboard();
                      setIsMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 bg-memora-primary text-white rounded-2xl hover:bg-memora-primary/90 transition-all duration-200 font-medium"
                  >
                    Minhas Músicas
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
