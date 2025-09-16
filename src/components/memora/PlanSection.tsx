import { Check, Clock, Music, Mic, Download, Sparkles } from "lucide-react";
import { useState } from "react";

const PlanSection = () => {
  const [isFirstSong, setIsFirstSong] = useState(true);
  const benefits = [
    {
      icon: Music,
      text: "Música personalizada de até 3 minutos"
    },
    {
      icon: Sparkles,
      text: "Estilos variados: Nacionais e Internacionais"
    },
    {
      icon: Mic,
      text: "Voz sintética avançada com qualidade profissional"
    },
    {
      icon: Download,
      text: "Entrega rápida em MP3"
    }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4">
            Um presente que toca o coração
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Crie memórias musicais únicas que ficarão para sempre
          </p>
        </div>

        {/* Plan Card */}
        <div className="max-w-2xl mx-auto pt-6">
          <div className="relative surface-1 rounded-2xl shadow-2xl">
            {/* Badge */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[60]">
              <div className="bg-gradient-to-r from-memora-secondary to-memora-coral px-6 py-2 rounded-full shadow-lg border-2 border-white/20">
                <span className="text-white font-heading font-bold text-sm">
                  🎉 Primeira música é grátis!
                </span>
              </div>
            </div>

            <div className="pt-12 pb-8 px-8 sm:px-12">
              {/* Plan Name */}
              <div className="text-center mb-8">
                <h3 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-2">
                  AI Premium
                </h3>
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-4xl sm:text-5xl font-heading font-bold text-primary">
                    {isFirstSong ? "R$ 0" : "R$ 149"}
                  </span>
                  <div className="text-left">
                    {isFirstSong && (
                      <div className="text-muted-foreground line-through text-lg">
                        R$ 149
                      </div>
                    )}
                    <div className="text-sm text-muted-foreground">
                      por música
                    </div>
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div className="space-y-4 mb-8">
                {benefits.map((benefit, index) => {
                  const IconComponent = benefit.icon;
                  
                  return (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                        <IconComponent className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-foreground font-medium">
                        {benefit.text}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* CTA Button */}
              <div className="text-center mb-6">
                <button 
                  className="w-full bg-gradient-to-r from-memora-primary to-memora-secondary hover:from-memora-primary/90 hover:to-memora-secondary/90 text-white font-heading font-bold py-4 px-8 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                  data-attr="plan-cta-button"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Sparkles className="w-5 h-5" />
                    <span>Crie sua música agora</span>
                  </div>
                </button>
              </div>

              {/* Timer */}
              <div className="flex items-center justify-center space-x-2 text-muted-foreground text-sm">
                <Clock className="w-4 h-4" />
                <span>Oferta limitada ao período de lançamento</span>
              </div>


            </div>
          </div>
        </div>

        {/* Bottom Features */}
        <div className="mt-16 grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <h4 className="font-heading font-bold text-foreground mb-1">
              Entrega Rápida
            </h4>
            <p className="text-sm text-muted-foreground">
              Sua música fica pronta em menos de 5 minutos
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6 text-secondary" />
            </div>
            <h4 className="font-heading font-bold text-foreground mb-1">
              100% Única
            </h4>
            <p className="text-sm text-muted-foreground">
              Cada música é criada exclusivamente para você
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-accent-coral/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Download className="w-6 h-6 text-accent-coral" />
            </div>
            <h4 className="font-heading font-bold text-foreground mb-1">
              Formato MP3
            </h4>
            <p className="text-sm text-muted-foreground">
              Compatível com todos os dispositivos
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlanSection;
