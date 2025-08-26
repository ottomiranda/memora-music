import { useState, useEffect } from "react";
import { Heart, Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === '/';

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

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-md shadow-lg"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <img 
              src={isHomePage && !isScrolled ? "/memora_logo_white.svg" : "/memora_logo.svg"} 
              alt="Memora Music" 
              className="h-9 w-auto"
            />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`${isHomePage && !isScrolled ? 'text-white hover:text-memora-gold' : 'text-memora-gray hover:text-memora-primary'} transition-colors duration-200 font-medium`}
            >
              Home
            </Link>
            <button
              onClick={() => scrollToSection("como-funciona")}
              className={`${isHomePage && !isScrolled ? 'text-white hover:text-memora-gold' : 'text-memora-gray hover:text-memora-primary'} transition-colors duration-200 font-medium`}
            >
              Como Funciona
            </button>
            <button
              onClick={() => scrollToSection("exemplos")}
              className={`${isHomePage && !isScrolled ? 'text-white hover:text-memora-gold' : 'text-memora-gray hover:text-memora-primary'} transition-colors duration-200 font-medium`}
            >
              Exemplos
            </button>
            <button
              onClick={() => scrollToSection("artistas")}
              className={`${isHomePage && !isScrolled ? 'text-white hover:text-memora-gold' : 'text-memora-gray hover:text-memora-primary'} transition-colors duration-200 font-medium`}
            >
              Artistas
            </button>
            <Link
              to="/criar"
              className="bg-memora-primary text-white px-6 py-2 rounded-2xl hover:bg-memora-primary/90 transition-all duration-200 font-medium shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Criar Música
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`${isHomePage && !isScrolled ? 'text-white hover:text-memora-gold' : 'text-memora-gray hover:text-memora-primary'} transition-colors duration-200`}
              aria-label="Menu de navegação"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-md border-t border-memora-gray-light">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                to="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block w-full text-left px-3 py-2 text-memora-gray hover:text-memora-primary transition-colors duration-200 font-medium"
              >
                Home
              </Link>
              <button
                onClick={() => scrollToSection("como-funciona")}
                className="block w-full text-left px-3 py-2 text-memora-gray hover:text-memora-primary transition-colors duration-200 font-medium"
              >
                Como Funciona
              </button>
              <button
                onClick={() => scrollToSection("exemplos")}
                className="block w-full text-left px-3 py-2 text-memora-gray hover:text-memora-primary transition-colors duration-200 font-medium"
              >
                Exemplos
              </button>
              <button
                onClick={() => scrollToSection("artistas")}
                className="block w-full text-left px-3 py-2 text-memora-gray hover:text-memora-primary transition-colors duration-200 font-medium"
              >
                Artistas
              </button>
              <Link
                to="/criar"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block w-full text-left px-3 py-2 bg-memora-primary text-white rounded-2xl hover:bg-memora-primary/90 transition-all duration-200 font-medium mt-2"
              >
                Criar Música
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;