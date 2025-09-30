import { Music, Heart, Mail, ExternalLink } from "lucide-react";
import { usePerformanceOptimizations } from '../hooks/useWebVitals';
import { useEffect, useRef } from 'react';

export default function Footer() {
  const { preloadResource } = usePerformanceOptimizations();
  const footerRef = useRef<HTMLElement>(null);

  // Preload recursos críticos quando o footer entra em vista
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Preload recursos que podem ser necessários
            preloadResource('/criar', 'document');
          }
        });
      },
      { threshold: 0.1 }
    );

    if (footerRef.current) {
      observer.observe(footerRef.current);
    }

    return () => observer.disconnect();
  }, [preloadResource]);

  return (
    <footer 
      ref={footerRef}
      className="bg-primary text-primary-foreground py-8 sm:py-12 mt-auto"
      role="contentinfo"
      aria-label="Informações do site"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Brand Section */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-1 space-y-4">
            <div className="flex items-center space-x-2">
              <div className="relative" aria-hidden="true">
                <Heart className="w-6 h-6 text-secondary" fill="currentColor" />
                <Music className="w-3 h-3 text-primary-foreground absolute -bottom-0.5 -right-0.5" />
              </div>
              <span className="text-xl font-bold">Memora.music</span>
            </div>
            <p className="text-primary-foreground/80 text-sm leading-relaxed max-w-xs">
              Transforme memórias em música com o poder da inteligência artificial.
            </p>
            <div className="flex items-center space-x-2 text-xs text-primary-foreground/60">
              <span>© 2024 Memora.music</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-4">
            <h3 className="font-heading font-semibold text-lg" id="footer-navigation">
              Navegação
            </h3>
            <nav aria-labelledby="footer-navigation">
              <ul className="space-y-3 text-sm">
                <li>
                  <a 
                    href="#como-funciona" 
                    className="text-primary-foreground/80 hover:text-secondary focus:text-secondary focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 focus:ring-offset-primary transition-smooth inline-flex items-center group"
                    aria-describedby="como-funciona-desc"
                  >
                    Como Funciona
                    <ExternalLink className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity" aria-hidden="true" />
                  </a>
                  <span id="como-funciona-desc" className="sr-only">Saiba como criar música com IA</span>
                </li>
                <li>
                  <a 
                    href="#exemplos" 
                    className="text-primary-foreground/80 hover:text-secondary focus:text-secondary focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 focus:ring-offset-primary transition-smooth inline-flex items-center group"
                    aria-describedby="exemplos-desc"
                  >
                    Exemplos
                    <ExternalLink className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity" aria-hidden="true" />
                  </a>
                  <span id="exemplos-desc" className="sr-only">Veja exemplos de músicas criadas</span>
                </li>
                <li>
                  <a 
                    href="/criar" 
                    className="text-primary-foreground/80 hover:text-secondary focus:text-secondary focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 focus:ring-offset-primary transition-smooth inline-flex items-center group font-medium"
                    aria-describedby="criar-desc"
                  >
                    Criar Música
                    <ExternalLink className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity" aria-hidden="true" />
                  </a>
                  <span id="criar-desc" className="sr-only">Comece a criar sua música agora</span>
                </li>
              </ul>
            </nav>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h3 className="font-heading font-semibold text-lg" id="footer-resources">
              Recursos
            </h3>
            <nav aria-labelledby="footer-resources">
              <ul className="space-y-3 text-sm">
                <li>
                  <a 
                    href="/ajuda" 
                    className="text-primary-foreground/80 hover:text-secondary focus:text-secondary focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 focus:ring-offset-primary transition-smooth inline-flex items-center group"
                  >
                    Central de Ajuda
                    <ExternalLink className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity" aria-hidden="true" />
                  </a>
                </li>
                <li>
                  <a 
                    href="/blog" 
                    className="text-primary-foreground/80 hover:text-secondary focus:text-secondary focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 focus:ring-offset-primary transition-smooth inline-flex items-center group"
                  >
                    Blog
                    <ExternalLink className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity" aria-hidden="true" />
                  </a>
                </li>
                <li>
                  <a 
                    href="/api" 
                    className="text-primary-foreground/80 hover:text-secondary focus:text-secondary focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 focus:ring-offset-primary transition-smooth inline-flex items-center group"
                  >
                    API
                    <ExternalLink className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity" aria-hidden="true" />
                  </a>
                </li>
              </ul>
            </nav>
          </div>

          {/* Contact & Legal */}
          <div className="space-y-4">
            <h3 className="font-heading font-semibold text-lg" id="footer-contact">
              Contato
            </h3>
            <div className="space-y-3 text-sm" aria-labelledby="footer-contact">
              <a 
                href="mailto:contato@memora.music" 
                className="text-primary-foreground/80 hover:text-secondary focus:text-secondary focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 focus:ring-offset-primary transition-smooth inline-flex items-center group"
                aria-label="Enviar email para contato@memora.music"
              >
                <Mail className="w-4 h-4 mr-2" aria-hidden="true" />
                contato@memora.music
              </a>
              <div className="pt-2 border-t border-primary-foreground/20">
                <nav aria-label="Links legais">
                  <ul className="space-y-2 text-xs text-primary-foreground/60">
                    <li>
                      <a 
                        href="/termos" 
                        className="hover:text-primary-foreground/80 focus:text-primary-foreground/80 focus:outline-none focus:ring-1 focus:ring-secondary transition-smooth"
                      >
                        Termos de Uso
                      </a>
                    </li>
                    <li>
                      <a 
                        href="/politica-de-privacidade" 
                        className="hover:text-primary-foreground/80 focus:text-primary-foreground/80 focus:outline-none focus:ring-1 focus:ring-secondary transition-smooth"
                      >
                        Política de Privacidade
                      </a>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar - Mobile Optimized */}
        <div className="mt-8 pt-6 border-t border-primary-foreground/20">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="text-xs text-primary-foreground/60 text-center sm:text-left">
              Feito com ❤️ para transformar memórias em música
            </div>
            <div className="flex items-center space-x-4 text-xs text-primary-foreground/60">
              <span>Versão 1.0.0</span>
              <span className="hidden sm:inline">•</span>
              <a 
                href="/status" 
                className="hover:text-primary-foreground/80 focus:text-primary-foreground/80 focus:outline-none focus:ring-1 focus:ring-secondary transition-smooth"
                aria-label="Verificar status do sistema"
              >
                Status
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}