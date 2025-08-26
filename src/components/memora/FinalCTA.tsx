import { Music, Play } from "lucide-react";

const FinalCTA = ({ onOpenAuth }: { onOpenAuth: () => void }) => {
  const scrollToExamples = () => {
    const element = document.getElementById('examples');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="py-20 lg:py-32 bg-gradient-to-br from-memora-primary via-memora-primary/95 to-memora-primary/90 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 border border-white/20 rounded-full" />
        <div className="absolute top-32 right-20 w-24 h-24 border border-white/20 rounded-full" />
        <div className="absolute bottom-20 left-1/4 w-40 h-40 border border-white/20 rounded-full" />
        <div className="absolute bottom-32 right-10 w-28 h-28 border border-white/20 rounded-full" />
        
        {/* Musical Notes */}
        <div className="absolute top-20 right-1/4">
          <Music className="w-8 h-8 text-white/20" />
        </div>
        <div className="absolute bottom-40 left-20">
          <Music className="w-6 h-6 text-white/20" />
        </div>
        <div className="absolute top-1/2 right-16">
          <Music className="w-10 h-10 text-white/20" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        {/* Main Content */}
        <div className="mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-6xl font-heading font-bold text-white mb-6 leading-tight">
            Surpreenda quem você ama com uma música feita só para ele ou ela
          </h2>
          <p className="text-xl lg:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
            É grátis no lançamento. Crie agora e descubra o poder de transformar sentimentos em melodia.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          {/* Primary CTA */}
          <button
            onClick={onOpenAuth}
            className="group bg-memora-secondary hover:bg-memora-secondary/90 text-memora-black font-heading font-bold py-5 px-10 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-2xl flex items-center space-x-3 text-lg"
            data-attr="final-cta-create-music"
          >
            <Music className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
            <span>Criar minha música grátis agora</span>
          </button>

          {/* Secondary CTA */}
          <button
            onClick={scrollToExamples}
            className="group border-2 border-white text-white hover:bg-white hover:text-memora-primary font-heading font-bold py-5 px-10 rounded-2xl transition-all duration-300 hover:scale-105 flex items-center space-x-3 text-lg"
            data-attr="final-cta-listen-examples"
          >
            <Play className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
            <span>Ouvir exemplos de músicas</span>
          </button>
        </div>

        {/* Additional Info */}
        <div className="mt-12 pt-8 border-t border-white/20">
          <div className="grid sm:grid-cols-3 gap-8 text-center">
            <div className="space-y-2">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Music className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-heading font-bold text-white text-lg">
                100% Personalizada
              </h3>
              <p className="text-white/80 text-sm">
                Cada música é única e criada especialmente para você
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                  <span className="text-memora-primary text-xs font-bold">IA</span>
                </div>
              </div>
              <h3 className="font-heading font-bold text-white text-lg">
                Tecnologia Avançada
              </h3>
              <p className="text-white/80 text-sm">
                Inteligência artificial de última geração para criar sua música
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <div className="w-6 h-6 text-white font-bold text-lg">
                  ♪
                </div>
              </div>
              <h3 className="font-heading font-bold text-white text-lg">
                Qualidade Profissional
              </h3>
              <p className="text-white/80 text-sm">
                Áudio em alta qualidade, pronto para compartilhar
              </p>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 flex flex-wrap justify-center items-center gap-8 text-white/60 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full" />
            <span>Grátis no lançamento</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full" />
            <span>Sem compromisso</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full" />
            <span>Resultado em minutos</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;