import { PenTool, Sparkles, Share2 } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      number: "1",
      icon: PenTool,
      title: "Conte sua história",
      description: "Escreva a ocasião e sentimentos.",
      color: "memora-primary"
    },
    {
      number: "2",
      icon: Sparkles,
      title: "A IA cria sua música",
      description: "Letra e melodia únicas, em menos de 5 minutos.",
      color: "memora-secondary"
    },
    {
      number: "3",
      icon: Share2,
      title: "Ouça e compartilhe",
      description: "Receba uma prévia e baixe em MP3.",
      color: "memora-coral"
    }
  ];

  return (
    <section id="como-funciona" className="py-20 bg-memora-gray-light/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-memora-black mb-4">
            Como funciona
          </h2>
          <p className="text-xl text-memora-gray max-w-3xl mx-auto">
            Transforme suas memórias em música em apenas 3 passos simples
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            
            return (
              <div
                key={step.number}
                className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
              >
                {/* Number Badge */}
                <div className={`absolute -top-4 left-8 w-12 h-12 bg-${step.color} rounded-full flex items-center justify-center shadow-lg`}>
                  <span className="text-white font-heading font-bold text-xl">
                    {step.number}
                  </span>
                </div>

                {/* Icon */}
                <div className="mb-6 mt-4">
                  <div className={`w-16 h-16 bg-${step.color}/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className={`w-8 h-8 text-${step.color}`} />
                  </div>
                </div>

                {/* Content */}
                <div>
                  <h3 className="text-xl font-heading font-bold text-memora-black mb-3">
                    {step.title}
                  </h3>
                  <p className="text-memora-gray leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Connector Line (except for last item) */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-6 lg:-right-12 w-6 lg:w-12 h-0.5 bg-gradient-to-r from-memora-primary/50 to-memora-secondary/50 transform -translate-y-1/2" />
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center space-x-2 bg-white px-6 py-3 rounded-full shadow-lg">
            <Sparkles className="w-5 h-5 text-memora-secondary" />
            <span className="text-memora-gray font-medium">
              Processo 100% automatizado com IA avançada
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;