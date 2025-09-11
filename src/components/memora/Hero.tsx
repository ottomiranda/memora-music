import { Play, Headphones, Music, Music2, Music3, Music4, Heart, Gift, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useMusicStore } from "@/store/musicStore";
import { useAuthStore } from "@/store/authStore";
import HeroSlideshow from "./HeroSlideshow";

const Hero = () => {
  const navigate = useNavigate();
  const { startNewCreationFlow } = useMusicStore();

  const handleCreateMusicClick = async () => {
    const { token } = useAuthStore.getState();
    await startNewCreationFlow(navigate, token);
  };

  const scrollToExamples = () => {
    const element = document.getElementById("exemplos");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-[#5B2FB8] via-[#2A1B3D] to-[#1A0F2E] pt-16">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#FEC641]/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#7B3FE4]/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Coluna Esquerda - Conteúdo Textual */}
          <div className="text-center lg:text-left">


            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold text-white leading-tight mb-6">
              A música que transforma{" "}
              <span className="text-[#FEC641]">sentimentos</span>{" "}
              em presente
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-white/90 leading-relaxed mb-10 max-w-2xl">
              Com a Memora, suas histórias viram música em minutos. Uma experiência única para emocionar quem você ama.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button
                size="lg"
                className="bg-[#FEC641] hover:bg-[#FEC641]/90 text-[#101010] px-8 py-4 rounded-2xl font-semibold text-lg shadow-2xl hover:shadow-[#FEC641]/25 hover:-translate-y-1 transition-all duration-300 border-0"
                data-attr="hero-cta-primary"
                onClick={handleCreateMusicClick}
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Crie sua música grátis agora
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                onClick={scrollToExamples}
                className="border-2 border-[#7B3FE4] bg-[#7B3FE4]/10 backdrop-blur-sm text-white hover:bg-[#7B3FE4] hover:text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                data-attr="hero-cta-secondary"
              >
                <Headphones className="w-5 h-5 mr-2" />
                Ouvir exemplos emocionantes
              </Button>
            </div>
          </div>

          {/* Coluna Direita - Slideshow com Player Flutuante */}
          <div className="relative">
            {/* Slideshow de Imagens */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <HeroSlideshow className="w-full h-[500px]" />
              
              {/* Player Flutuante Sobreposto - Versão Sutil */}
              <div className="absolute bottom-4 right-4 w-64">
                <div className="bg-white/80 backdrop-blur-md rounded-xl p-3 shadow-lg border border-white/30 hover:bg-white/90 transition-all duration-300">
                  {/* Header do Player Compacto */}
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#7B3FE4] to-[#3ECFBB] rounded-lg flex items-center justify-center shadow-md">
                      <Play className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-[#101010] text-sm truncate">Nossa História de Amor</h4>
                      <p className="text-[#101010]/60 text-xs">Memora IA</p>
                    </div>
                  </div>
                  
                  {/* Visualização de Ondas Sonoras Compacta */}
                  <div className="flex items-center justify-center space-x-0.5 mb-2">
                    {[...Array(16)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-0.5 rounded-full transition-all duration-300 ${
                          i % 4 === 0 ? 'h-4 bg-[#7B3FE4]' : 
                          i % 3 === 0 ? 'h-3 bg-[#3ECFBB]' : 
                          i % 2 === 0 ? 'h-2 bg-[#FF5A73]' : 'h-1.5 bg-[#7B3FE4]/50'
                        }`}
                        style={{
                          animationDelay: `${i * 0.1}s`,
                          animation: 'pulse 2s infinite'
                        }}
                      />
                    ))}
                  </div>
                  
                  {/* Barra de Progresso Compacta */}
                  <div className="w-full h-1 bg-[#F4F4F4] rounded-full overflow-hidden mb-1">
                    <div className="w-2/5 h-full bg-gradient-to-r from-[#7B3FE4] to-[#3ECFBB] rounded-full transition-all duration-300" />
                  </div>
                  
                  {/* Tempo Compacto */}
                  <div className="flex justify-between text-xs text-[#101010]/50">
                    <span>1:23</span>
                    <span>3:45</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Ícones Decorativos Flutuantes */}
            {/* Coração Grande - Canto Superior Direito */}
            <div className="absolute -top-8 -right-8 w-20 h-20 bg-[#FF5A73]/20 backdrop-blur-sm rounded-full flex items-center justify-center animate-pulse shadow-lg">
              <Heart className="w-10 h-10 text-[#FF5A73] fill-[#FF5A73]" />
            </div>
            
            {/* Nota Musical Média - Canto Inferior Esquerdo */}
            <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-[#3ECFBB]/20 backdrop-blur-sm rounded-full flex items-center justify-center animate-pulse shadow-lg">
              <Music className="w-8 h-8 text-[#3ECFBB]" />
            </div>
            
            {/* Coração Pequeno - Canto Superior Esquerdo */}
            <div className="absolute top-12 -left-8 w-12 h-12 bg-[#FEC641]/20 backdrop-blur-sm rounded-full flex items-center justify-center animate-pulse shadow-lg" style={{animationDelay: '0.5s'}}>
              <Heart className="w-6 h-6 text-[#FEC641] fill-[#FEC641]" />
            </div>
            
            {/* Nota Musical - Lado Direito */}
            <div className="absolute top-1/3 -right-6 w-14 h-14 bg-[#7B3FE4]/20 backdrop-blur-sm rounded-full flex items-center justify-center animate-pulse shadow-lg" style={{animationDelay: '1s'}}>
              <Music2 className="w-7 h-7 text-[#7B3FE4]" />
            </div>
            
            {/* Presente - Canto Inferior Direito */}
            <div className="absolute bottom-20 -right-4 w-12 h-12 bg-[#FF5A73]/25 backdrop-blur-sm rounded-full flex items-center justify-center animate-pulse shadow-lg" style={{animationDelay: '1.5s'}}>
              <Gift className="w-6 h-6 text-[#FF5A73]" />
            </div>
            
            {/* Coração Extra Pequeno - Lado Esquerdo */}
            <div className="absolute bottom-1/4 -left-4 w-10 h-10 bg-[#3ECFBB]/25 backdrop-blur-sm rounded-full flex items-center justify-center animate-pulse shadow-lg" style={{animationDelay: '2s'}}>
              <Heart className="w-5 h-5 text-[#3ECFBB] fill-[#3ECFBB]" />
            </div>
            
            {/* Nota Musical - Centro Superior */}
            <div className="absolute -top-4 left-1/3 w-12 h-12 bg-[#7B3FE4]/20 backdrop-blur-sm rounded-full flex items-center justify-center animate-pulse shadow-lg" style={{animationDelay: '0.8s'}}>
              <Music3 className="w-6 h-6 text-[#7B3FE4]" />
            </div>
            
            {/* Nota Musical Extra - Centro Direito */}
            <div className="absolute top-2/3 right-4 w-8 h-8 bg-[#FEC641]/30 backdrop-blur-sm rounded-full flex items-center justify-center animate-pulse shadow-lg" style={{animationDelay: '2.5s'}}>
              <Music4 className="w-4 h-4 text-[#FEC641]" />
            </div>
          </div>
        </div>
      </div>


    </section>
  );
};

export default Hero;
