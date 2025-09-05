import { Button } from "@/components/ui/button";
import { Play, Sparkles, Heart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useMusicStore } from "@/store/musicStore";
import { useAuthStore } from "@/store/authStore";
import heroImage from "@/assets/hero-music.jpg";

export default function HeroSection() {
  const navigate = useNavigate();
  const { startNewCreationFlow } = useMusicStore();

  const handleCreateSongClick = async () => {
    const { token } = useAuthStore.getState();
    await startNewCreationFlow(navigate, token);
  };

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-slate-700 via-slate-800 to-purple-900 overflow-hidden flex items-center justify-center">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Memora.music - Transforme memórias em música"
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/30 to-background"></div>
      </div>

      {/* Floating Musical Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-primary rounded-full opacity-60 float-gentle"></div>
        <div className="absolute top-1/3 right-1/3 w-6 h-6 bg-accent-coral rounded-full opacity-40 float-gentle" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-1/3 left-1/5 w-3 h-3 bg-accent-turquoise rounded-full opacity-70 float-gentle" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-5 h-5 bg-secondary rounded-full opacity-50 float-gentle" style={{ animationDelay: '0.5s' }}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 text-center space-y-8">
        <div className="space-y-4">
          <div className="flex items-center justify-center space-x-2 text-primary mb-4">
            <Sparkles className="w-6 h-6" />
            <span className="text-sm font-medium uppercase tracking-wider">Powered by AI</span>
            <Sparkles className="w-6 h-6" />
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold leading-tight">
            Transforme{" "}
            <span className="bg-gradient-music bg-clip-text text-transparent">
              memórias
            </span>
            <br />
            em música
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Crie canções personalizadas de 3 minutos em segundos. 
            O presente perfeito para momentos especiais e emoções únicas.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button variant="hero" size="xl" className="group" onClick={handleCreateSongClick}>
            <Heart className="w-5 h-5 group-hover:scale-110 transition-transform" />
            Criar Minha Canção Agora
          </Button>
          
          <Button variant="outline" size="xl" className="group">
            <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
            Ouvir Exemplo
          </Button>
        </div>

        <div className="pt-8">
          <p className="text-sm text-muted-foreground">
            ✨ Sem cadastro necessário • 🎵 Resultados em minutos • ❤️ Presente único
          </p>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-primary rounded-full flex justify-center">
          <div className="w-1 h-3 bg-primary rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
}