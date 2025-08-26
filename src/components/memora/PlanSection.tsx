import { Check, Clock, Music, Mic, Download, Sparkles } from "lucide-react";

const PlanSection = () => {
  const benefits = [
    {
      icon: Music,
      text: "Música personalizada de até 3 minutos"
    },
    {
      icon: Sparkles,
      text: "Estilos variados: pop, romântico, infantil, sertanejo e mais"
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
    <section className="py-20 bg-gradient-to-br from-memora-primary/5 to-memora-secondary/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-memora-black mb-4">
            Um presente que toca o coração
          </h2>
          <p className="text-xl text-memora-gray max-w-3xl mx-auto">
            Crie memórias musicais únicas que ficarão para sempre
          </p>
        </div>

        {/* Plan Card */}
        <div className="max-w-2xl mx-auto">
          <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Badge */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="bg-gradient-to-r from-memora-secondary to-memora-coral px-6 py-2 rounded-full shadow-lg">
                <span className="text-white font-heading font-bold text-sm">
                  🎉 GRÁTIS NO LANÇAMENTO
                </span>
              </div>
            </div>

            <div className="pt-12 pb-8 px-8 sm:px-12">
              {/* Plan Name */}
              <div className="text-center mb-8">
                <h3 className="text-2xl sm:text-3xl font-heading font-bold text-memora-black mb-2">
                  AI Premium
                </h3>
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-4xl sm:text-5xl font-heading font-bold text-memora-primary">
                    R$ 0
                  </span>
                  <div className="text-left">
                    <div className="text-memora-gray line-through text-lg">
                      R$ 149
                    </div>
                    <div className="text-sm text-memora-gray">
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
                      <div className="flex-shrink-0 w-6 h-6 bg-memora-primary/10 rounded-full flex items-center justify-center mt-0.5">
                        <IconComponent className="w-4 h-4 text-memora-primary" />
                      </div>
                      <span className="text-memora-black font-medium">
                        {benefit.text}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* CTA Button */}
              <div className="text-center mb-6">
                <button 
                  className="w-full bg-gradient-to-r from-memora-secondary to-memora-secondary/90 hover:from-memora-secondary/90 hover:to-memora-secondary text-white font-heading font-bold py-4 px-8 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                  data-attr="plan-cta-button"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Sparkles className="w-5 h-5" />
                    <span>Gerar minha música grátis agora</span>
                  </div>
                </button>
              </div>

              {/* Timer */}
              <div className="flex items-center justify-center space-x-2 text-memora-gray text-sm">
                <Clock className="w-4 h-4" />
                <span>Oferta limitada ao período de lançamento</span>
              </div>

              {/* Disclaimer */}
              <div className="mt-6 p-4 bg-memora-gray-light/50 rounded-xl">
                <p className="text-xs text-memora-gray text-center leading-relaxed">
                  * Gratuidade limitada ao período de lançamento. Após o período promocional, 
                  o valor será de R$ 149,00 por música personalizada.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Features */}
        <div className="mt-16 grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="w-12 h-12 bg-memora-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-memora-primary" />
            </div>
            <h4 className="font-heading font-bold text-memora-black mb-1">
              Entrega Rápida
            </h4>
            <p className="text-sm text-memora-gray">
              Sua música fica pronta em menos de 5 minutos
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-memora-secondary/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6 text-memora-secondary" />
            </div>
            <h4 className="font-heading font-bold text-memora-black mb-1">
              100% Única
            </h4>
            <p className="text-sm text-memora-gray">
              Cada música é criada exclusivamente para você
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-memora-coral/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Download className="w-6 h-6 text-memora-coral" />
            </div>
            <h4 className="font-heading font-bold text-memora-black mb-1">
              Formato MP3
            </h4>
            <p className="text-sm text-memora-gray">
              Compatível com todos os dispositivos
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlanSection;