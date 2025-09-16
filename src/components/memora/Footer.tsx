import { Heart } from "lucide-react";
import { useState } from "react";
import FeedbackPopup from "@/components/memora/FeedbackPopup";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const [isFeedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <footer className="py-12 bg-neutral-dark text-foreground border-t border-white/10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Logo and Description */}
          <div className="md:col-span-2">
            <div className="flex items-center mb-4">
              <img 
                src="/memora_logo_white.svg" 
                alt="Memora Music" 
                className="h-10 w-auto"
              />
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed mb-4 max-w-md">
              Transforme memórias em música com Inteligência Artificial. 
              Crie canções únicas e emocionantes para presentear pessoas especiais.
            </p>
            <button
              onClick={() => setFeedbackOpen(true)}
              className="text-left bg-primary/10 border border-primary/20 rounded-xl p-3 max-w-md text-secondary text-xs font-medium hover:bg-primary/15 transition"
            >
              🚀 MVP em fase de testes. Sua opinião é muito importante para nós!
            </button>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-heading font-bold text-foreground mb-4">
              Links Rápidos
            </h3>
            <ul className="space-y-3">
              <li>
                <button 
                  onClick={() => document.getElementById('como-funciona')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-muted-foreground hover:text-secondary transition-colors duration-200 text-sm"
                >
                  Como Funciona
                </button>
              </li>
              <li>
                <button 
                  onClick={() => document.getElementById('exemplos')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-muted-foreground hover:text-secondary transition-colors duration-200 text-sm"
                >
                  Exemplos
                </button>
              </li>
              <li>
                <button 
                  onClick={() => document.getElementById('artistas')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-muted-foreground hover:text-secondary transition-colors duration-200 text-sm"
                >
                  Artistas
                </button>
              </li>
              <li>
                <button 
                  onClick={() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-muted-foreground hover:text-secondary transition-colors duration-200 text-sm"
                >
                  FAQ
                </button>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-heading font-bold text-foreground mb-4">
              Legal
            </h3>
            <ul className="space-y-3">
              <li>
                <a 
                  href="#termos" 
                  className="text-muted-foreground hover:text-secondary transition-colors duration-200 text-sm"
                >
                  Termos de Uso
                </a>
              </li>
              <li>
                <a 
                  href="#privacidade" 
                  className="text-muted-foreground hover:text-secondary transition-colors duration-200 text-sm"
                >
                  Política de Privacidade
                </a>
              </li>
              <li>
                <a 
                  href="#contato" 
                  className="text-muted-foreground hover:text-secondary transition-colors duration-200 text-sm"
                >
                  Contato
                </a>
              </li>
              <li>
                <a 
                  href="#cookies" 
                  className="text-muted-foreground hover:text-secondary transition-colors duration-200 text-sm"
                >
                  Política de Cookies
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6">
              <p className="text-muted-foreground text-sm">
                © {currentYear} Memora Music. Todos os direitos reservados.
              </p>
              <div className="flex items-center space-x-4">
                <span className="text-muted-foreground text-xs">
                  Feito com
                </span>
                <Heart className="w-4 h-4 text-memora-coral fill-current" />
                <span className="text-muted-foreground text-xs">
                  para criar memórias inesquecíveis
                </span>
              </div>
            </div>

            {/* Social Links Placeholder */}
            <div className="flex items-center space-x-4">
              <span className="text-muted-foreground text-xs">
                Em breve nas redes sociais
              </span>
              <div className="flex space-x-2">
                <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 bg-white/20 rounded-full" />
                </div>
                <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 bg-white/20 rounded-full" />
                </div>
                <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 bg-white/20 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Modal */}
        <FeedbackPopup isOpen={isFeedbackOpen} onClose={() => setFeedbackOpen(false)} />
      </div>
    </footer>
  );
};

export default Footer;
