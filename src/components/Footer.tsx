import { Music, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Heart className="w-6 h-6 text-secondary" fill="currentColor" />
                <Music className="w-3 h-3 text-primary-foreground absolute -bottom-0.5 -right-0.5" />
              </div>
              <span className="text-xl font-bold">Memora.music</span>
            </div>
            <p className="text-primary-foreground/80 text-sm">
              Transforme memórias em música com o poder da inteligência artificial.
            </p>
          </div>

          {/* Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Links</h3>
            <div className="space-y-2 text-sm">
              <div><a href="#como-funciona" className="text-primary-foreground/80 hover:text-secondary transition-smooth">Como Funciona</a></div>
              <div><a href="#exemplos" className="text-primary-foreground/80 hover:text-secondary transition-smooth">Exemplos</a></div>
              <div><a href="/criar" className="text-primary-foreground/80 hover:text-secondary transition-smooth">Criar Música</a></div>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Contato</h3>
            <div className="space-y-2 text-sm text-primary-foreground/80">
              <div>contato@memora.music</div>
              <div>© 2024 Memora.music</div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}