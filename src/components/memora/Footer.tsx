import { Heart } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-memora-black text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
            <p className="text-memora-gray-light text-sm leading-relaxed mb-4 max-w-md">
              Transforme memórias em música com Inteligência Artificial. 
              Crie canções únicas e emocionantes para presentear pessoas especiais.
            </p>
            <div className="bg-memora-primary/10 border border-memora-primary/20 rounded-xl p-3 max-w-md">
              <p className="text-memora-gold text-xs font-medium">
                🚀 MVP em fase de testes. Sua opinião é muito importante para nós!
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-heading font-bold text-white mb-4">
              Links Rápidos
            </h3>
            <ul className="space-y-3">
              <li>
                <button 
                  onClick={() => document.getElementById('como-funciona')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-memora-gray-light hover:text-memora-gold transition-colors duration-200 text-sm"
                >
                  Como Funciona
                </button>
              </li>
              <li>
                <button 
                  onClick={() => document.getElementById('exemplos')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-memora-gray-light hover:text-memora-gold transition-colors duration-200 text-sm"
                >
                  Exemplos
                </button>
              </li>
              <li>
                <button 
                  onClick={() => document.getElementById('artistas')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-memora-gray-light hover:text-memora-gold transition-colors duration-200 text-sm"
                >
                  Artistas
                </button>
              </li>
              <li>
                <button 
                  onClick={() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-memora-gray-light hover:text-memora-gold transition-colors duration-200 text-sm"
                >
                  FAQ
                </button>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-heading font-bold text-white mb-4">
              Legal
            </h3>
            <ul className="space-y-3">
              <li>
                <a 
                  href="#termos" 
                  className="text-memora-gray-light hover:text-memora-gold transition-colors duration-200 text-sm"
                >
                  Termos de Uso
                </a>
              </li>
              <li>
                <a 
                  href="#privacidade" 
                  className="text-memora-gray-light hover:text-memora-gold transition-colors duration-200 text-sm"
                >
                  Política de Privacidade
                </a>
              </li>
              <li>
                <a 
                  href="#contato" 
                  className="text-memora-gray-light hover:text-memora-gold transition-colors duration-200 text-sm"
                >
                  Contato
                </a>
              </li>
              <li>
                <a 
                  href="#cookies" 
                  className="text-memora-gray-light hover:text-memora-gold transition-colors duration-200 text-sm"
                >
                  Política de Cookies
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-memora-gray/20 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6">
              <p className="text-memora-gray-light text-sm">
                © {currentYear} Memora Music. Todos os direitos reservados.
              </p>
              <div className="flex items-center space-x-4">
                <span className="text-memora-gray-light text-xs">
                  Feito com
                </span>
                <Heart className="w-4 h-4 text-memora-coral fill-current" />
                <span className="text-memora-gray-light text-xs">
                  para criar memórias inesquecíveis
                </span>
              </div>
            </div>

            {/* Social Links Placeholder */}
            <div className="flex items-center space-x-4">
              <span className="text-memora-gray-light text-xs">
                Em breve nas redes sociais
              </span>
              <div className="flex space-x-2">
                <div className="w-8 h-8 bg-memora-gray/20 rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 bg-memora-gray/40 rounded-full" />
                </div>
                <div className="w-8 h-8 bg-memora-gray/20 rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 bg-memora-gray/40 rounded-full" />
                </div>
                <div className="w-8 h-8 bg-memora-gray/20 rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 bg-memora-gray/40 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Beta Notice */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center space-x-2 bg-memora-primary/10 border border-memora-primary/20 rounded-full px-4 py-2">
            <div className="w-2 h-2 bg-memora-gold rounded-full animate-pulse" />
            <span className="text-memora-gold text-xs font-medium">
              Versão Beta • Ajude-nos a melhorar com seu feedback
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;