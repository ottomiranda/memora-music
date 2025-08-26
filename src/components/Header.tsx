import { Music, Heart } from "lucide-react";
import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2 group">
          <div className="relative">
            <Heart className="w-8 h-8 text-primary group-hover:text-primary-glow transition-smooth" fill="currentColor" />
            <Music className="w-4 h-4 text-secondary absolute -bottom-1 -right-1" />
          </div>
          <span className="text-2xl font-bold bg-gradient-music bg-clip-text text-transparent">
            Memora.music
          </span>
        </Link>
        
        <nav className="hidden md:flex items-center space-x-6">
          <a href="#como-funciona" className="text-muted-foreground hover:text-foreground transition-smooth">
            Como Funciona
          </a>
          <a href="#exemplos" className="text-muted-foreground hover:text-foreground transition-smooth">
            Exemplos
          </a>
          <Link to="/criar" className="text-muted-foreground hover:text-foreground transition-smooth">
            Criar Música
          </Link>
        </nav>
      </div>
    </header>
  );
}