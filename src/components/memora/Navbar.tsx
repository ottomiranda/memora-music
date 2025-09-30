import { useState, useEffect, useCallback } from "react";
import { Menu, X, Sparkles, LogOut } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { ProfileDropdown } from "../ui/ProfileDropdown";
import { useAuthStore } from "../../store/authStore";
import { useUiStore } from "../../store/uiStore";
import { useMusicStore } from "../../store/musicStore";
import { NAVBAR_TOTAL_OFFSET } from "@/constants/layout";
import { useTranslation } from '@/i18n/hooks/useTranslation';
import { useLocalizedRoutes } from '@/hooks/useLocalizedRoutes';


const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  

  const location = useLocation();
  const navigate = useNavigate();
  const isAtTop = !isScrolled;
  const { t } = useTranslation('common');
  const { buildPath } = useLocalizedRoutes();
  
  // Auth state
  const { isLoggedIn, user, logout } = useAuthStore();
  const { showAuthPopup } = useUiStore();
  const { startNewCreationFlow } = useMusicStore();

  const goToDashboard = () => {
    const dashboardPath = buildPath('myMusic');
    if (isLoggedIn) {
      navigate(dashboardPath);
    } else {
      showAuthPopup(() => navigate(dashboardPath));
    }
    setIsMobileMenuOpen(false);
  };

  const handleCreateMusicClick = async () => {
    const { token } = useAuthStore.getState();
    navigate(buildPath('create'));
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

  const performScrollToSection = useCallback((sectionId: string) => {
    let targetElement: Element | null = null;

    const sectionElement = document.getElementById(sectionId);
    if (sectionElement) {
      const titleElement = sectionElement.querySelector('h2, h1, h3');
      targetElement = titleElement || sectionElement;
    }

    if (targetElement) {
      const elementPosition = targetElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - NAVBAR_TOTAL_OFFSET;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }, []);

  const scrollToSection = (sectionId: string) => {
    setIsMobileMenuOpen(false);

    if (location.pathname !== '/') {
      navigate('/', { state: { scrollTo: sectionId } });
      return;
    }

    performScrollToSection(sectionId);
  };

  useEffect(() => {
    const state = location.state as ({ scrollTo?: string } & Record<string, unknown>) | null;
    if (location.pathname === '/' && state?.scrollTo) {
      const timer = window.setTimeout(() => {
        performScrollToSection(state.scrollTo!);
        const { scrollTo, ...rest } = state;
        const hasAdditionalState = Object.keys(rest).length > 0;
        navigate(location.pathname, { replace: true, state: hasAdditionalState ? rest : undefined });
      }, 80);

      return () => window.clearTimeout(timer);
    }
  }, [location, navigate, performScrollToSection]);

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
      id="main-navigation"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 liquid-glass ${navVariant}`}
      role="navigation"
      aria-label="Navegação principal"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link 
              to="/"
              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-memora-secondary focus-visible:ring-offset-2 rounded-md"
              aria-label="Ir para página inicial - Memora Music"
            >
              <img 
                src={isAtTop ? "/memora_logo_white.svg" : "/memora_logo.svg"} 
                alt="Memora Music - Logotipo" 
                className="h-9 w-auto cursor-pointer"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8" role="menubar">
            <Button
              onClick={() => scrollToSection("como-funciona")}
              variant="ghost"
              className={`${desktopNavItemClasses} focus-visible:ring-2 focus-visible:ring-memora-secondary focus-visible:ring-offset-2 rounded-md`}
              role="menuitem"
              aria-label="Ir para seção Como Funciona"
            >
              {t('navigation.howItWorks')}
            </Button>
            <Button
              onClick={() => scrollToSection("exemplos")}
              variant="ghost"
              className={`${desktopNavItemClasses} focus-visible:ring-2 focus-visible:ring-memora-secondary focus-visible:ring-offset-2 rounded-md`}
              role="menuitem"
              aria-label="Ir para seção Exemplos"
            >
              {t('navigation.examples')}
            </Button>
            <Button
              onClick={() => scrollToSection("artistas")}
              variant="ghost"
              className={`${desktopNavItemClasses} focus-visible:ring-2 focus-visible:ring-memora-secondary focus-visible:ring-offset-2 rounded-md`}
              role="menuitem"
              aria-label="Ir para seção Artistas"
            >
              {t('navigation.artists')}
            </Button>
            <Button
              onClick={() => scrollToSection("precos")}
              variant="ghost"
              className={`${desktopNavItemClasses} focus-visible:ring-2 focus-visible:ring-memora-secondary focus-visible:ring-offset-2 rounded-md`}
              role="menuitem"
              aria-label="Ir para seção Preços"
            >
              {t('navigation.pricing')}
            </Button>
            <Button
              onClick={() => scrollToSection("faq")}
              variant="ghost"
              className={`${desktopNavItemClasses} focus-visible:ring-2 focus-visible:ring-memora-secondary focus-visible:ring-offset-2 rounded-md`}
              role="menuitem"
              aria-label="Ir para seção Perguntas Frequentes"
            >
              {t('navigation.faq')}
            </Button>
            <Button
              onClick={() => goToDashboard()}
              variant="ghost"
              className={`${desktopNavItemClasses} focus-visible:ring-2 focus-visible:ring-memora-secondary focus-visible:ring-offset-2 rounded-md`}
              role="menuitem"
              aria-label="Ir para Minhas Músicas"
            >
              {t('navigation.myMusic')}
            </Button>

            {/* Auth Section */}
            <div className="flex items-center gap-4">

              <Button 
                variant="glass"
                onClick={() => handleCreateMusicClick()}
                className="flex items-center gap-2"
                aria-label={t('navigation.createMusic')}
              >
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                {t('navigation.createMusic')}
              </Button>

              {isLoggedIn && (
                <ProfileDropdown
                  userName={user?.name || 'Usuário'}
                  userEmail={user?.email}
                  onProfileClick={() => {
                    // TODO: Implementar navegação para perfil
                    console.log('Navegar para perfil');
                  }}
                  onSettingsClick={() => {
                    // TODO: Implementar navegação para configurações
                    console.log('Navegar para configurações');
                  }}
                  onLogoutClick={() => logout().catch(console.error)}
                />
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">

            <Button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              variant="ghost"
              size="icon"
              className={`${isAtTop ? 'text-white hover:text-memora-secondary' : 'text-[#08060D] hover:text-memora-secondary'} transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-memora-secondary focus-visible:ring-offset-2 rounded-md`}
              aria-label={isMobileMenuOpen ? "Fechar menu de navegação" : "Abrir menu de navegação"}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
              aria-haspopup="true"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" aria-hidden="true" />
              ) : (
                <Menu className="w-6 h-6" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu Fullscreen */}
        {isMobileMenuOpen && (
          <div 
            id="mobile-menu"
            className="md:hidden fixed inset-0 top-16 z-[9998] bg-white/95 backdrop-blur-lg"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-menu-title"

          >
            <div className="flex flex-col h-full px-6 py-8">
              {/* Navigation Links */}
              <div className="flex-1 space-y-2" role="menu">
                <h2 id="mobile-menu-title" className="sr-only">Menu de Navegação</h2>
                <Button
                  onClick={() => scrollToSection("como-funciona")}
                  variant="ghost"
                  className="w-full text-left px-4 py-4 text-lg text-[#08060D] hover:text-memora-secondary hover:bg-memora-secondary/10 transition-all duration-300 font-medium h-auto justify-start rounded-xl min-h-[44px] active:scale-95 focus-visible:ring-2 focus-visible:ring-memora-secondary focus-visible:ring-offset-2"
                  role="menuitem"
                  aria-label="Ir para seção Como Funciona"
                >
                  {t('navigation.howItWorks')}
                </Button>
                <Button
                  onClick={() => scrollToSection("exemplos")}
                  variant="ghost"
                  className="w-full text-left px-4 py-4 text-lg text-[#08060D] hover:text-memora-secondary hover:bg-memora-secondary/10 transition-all duration-300 font-medium h-auto justify-start rounded-xl min-h-[44px] active:scale-95 focus-visible:ring-2 focus-visible:ring-memora-secondary focus-visible:ring-offset-2"
                  role="menuitem"
                  aria-label="Ir para seção Exemplos"
                >
                  {t('navigation.examples')}
                </Button>
                <Button
                  onClick={() => scrollToSection("artistas")}
                  variant="ghost"
                  className="w-full text-left px-4 py-4 text-lg text-[#08060D] hover:text-memora-secondary hover:bg-memora-secondary/10 transition-all duration-300 font-medium h-auto justify-start rounded-xl min-h-[44px] active:scale-95 focus-visible:ring-2 focus-visible:ring-memora-secondary focus-visible:ring-offset-2"
                  role="menuitem"
                  aria-label="Ir para seção Artistas"
                >
                  {t('navigation.artists')}
                </Button>
                <Button
                  onClick={() => scrollToSection("precos")}
                  variant="ghost"
                  className="w-full text-left px-4 py-4 text-lg text-[#08060D] hover:text-memora-secondary hover:bg-memora-secondary/10 transition-all duration-300 font-medium h-auto justify-start rounded-xl min-h-[44px] active:scale-95 focus-visible:ring-2 focus-visible:ring-memora-secondary focus-visible:ring-offset-2"
                  role="menuitem"
                  aria-label="Ir para seção Preços"
                >
                  {t('navigation.pricing')}
                </Button>
                <Button
                  onClick={() => scrollToSection("faq")}
                  variant="ghost"
                  className="w-full text-left px-4 py-4 text-lg text-[#08060D] hover:text-memora-secondary hover:bg-memora-secondary/10 transition-all duration-300 font-medium h-auto justify-start rounded-xl min-h-[44px] active:scale-95 focus-visible:ring-2 focus-visible:ring-memora-secondary focus-visible:ring-offset-2"
                  role="menuitem"
                  aria-label="Ir para seção Perguntas Frequentes"
                >
                  {t('navigation.faq')}
                </Button>
                <Button
                  onClick={() => goToDashboard()}
                  variant="ghost"
                  className="w-full text-left px-4 py-4 text-lg text-[#08060D] hover:text-memora-secondary hover:bg-memora-secondary/10 transition-all duration-300 font-medium h-auto justify-start rounded-xl min-h-[44px] active:scale-95 focus-visible:ring-2 focus-visible:ring-memora-secondary focus-visible:ring-offset-2"
                  role="menuitem"
                  aria-label="Ir para Minhas Músicas"
                >
                  {t('navigation.myMusic')}
                </Button>
              </div>



              {/* Auth Section Mobile */}
              <div className="border-t border-gray-200 pt-6 space-y-4" role="group" aria-labelledby="auth-section-title">
                <h3 id="auth-section-title" className="sr-only">Seção de Autenticação</h3>
                {isLoggedIn ? (
                  // --- Estado Logado Mobile ---
                  <>
                    <div className="px-4 py-2">
                      <span className="text-lg font-medium text-[#08060D]">
                        Olá, {getFirstName(user?.name) || 'Usuário'}!
                      </span>
                    </div>
                    <Button
                      variant="glass"
                      onClick={() => {
                        handleCreateMusicClick();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-3 py-4 text-lg min-h-[44px] active:scale-95 transition-transform duration-200 focus-visible:ring-2 focus-visible:ring-memora-secondary focus-visible:ring-offset-2"
                      aria-label={t('navigation.createMusic')}
                    >
                      <Sparkles className="w-5 h-5" aria-hidden="true" />
                      {t('navigation.createMusic')}
                    </Button>
                    <Button
                      onClick={() => {
                        logout().catch(console.error);
                        setIsMobileMenuOpen(false);
                      }}
                      variant="ghost"
                      className="w-full text-left px-4 py-4 text-lg text-[#08060D] hover:text-red-600 hover:bg-red-50 transition-all duration-300 font-medium h-auto justify-start flex items-center gap-3 rounded-xl min-h-[44px] active:scale-95 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                      aria-label="Fazer logout da conta"
                    >
                      <LogOut className="w-5 h-5" aria-hidden="true" />
                      Sair
                    </Button>
                  </>
                ) : (
                  // --- Estado Deslogado Mobile ---
                  <Button
                    variant="glass"
                    onClick={() => {
                      handleCreateMusicClick();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-3 py-4 text-lg min-h-[44px] active:scale-95 transition-transform duration-200"
                  >
                    <Sparkles className="w-5 h-5" />
                    {t('navigation.createMusic')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
