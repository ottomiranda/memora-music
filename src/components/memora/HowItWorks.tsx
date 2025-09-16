import React, { useState, useEffect } from "react";
import { PenTool, Sparkles, Share2 } from "lucide-react";

const HowItWorks = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const steps = [
    {
      number: "1",
      icon: PenTool,
      title: "Conte sua história",
      description: "Escreva a ocasião e sentimentos que você quer transformar em música.",
      details: "Nossa IA analisa suas palavras para capturar a essência emocional da sua história.",
      color: "memora-primary"
    },
    {
      number: "2",
      icon: Sparkles,
      title: "A IA cria sua música",
      description: "Letra e melodia únicas, em menos de 5 minutos.",
      details: "Algoritmos avançados compõem uma canção personalizada baseada na sua narrativa.",
      color: "memora-secondary"
    },
    {
      number: "3",
      icon: Share2,
      title: "Ouça e compartilhe",
      description: "Receba uma prévia e baixe em MP3.",
      details: "Sua música está pronta para emocionar e ser compartilhada com quem você ama.",
      color: "memora-coral"
    }
  ];

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, steps.length]);

  const handleStepClick = (index: number) => {
    setActiveStep(index);
    setIsAutoPlaying(false);
    // Resume auto-play after 8 seconds of inactivity
    setTimeout(() => setIsAutoPlaying(true), 8000);
  };

  return (
    <section id="como-funciona" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4">
            Como funciona
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Transforme suas memórias em música em apenas 3 passos simples
          </p>
        </div>

        {/* Interactive Timeline */}
        <div className="relative">
          {/* Timeline Navigation */}
          <div className="flex justify-center mb-12">
            <div className="relative flex items-center space-x-8 md:space-x-16">
              {/* Timeline Line */}
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-memora-primary/20 via-memora-secondary/20 to-memora-coral/20 rounded-full transform -translate-y-1/2" />
              
              {/* Active Progress Line */}
              <div 
                className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-memora-primary via-memora-secondary to-memora-coral rounded-full transform -translate-y-1/2 transition-all duration-1000 ease-out"
                style={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
              />
              
              {/* Step Indicators */}
              {steps.map((step, index) => {
                const IconComponent = step.icon;
                const isActive = index === activeStep;
                const isPassed = index < activeStep;
                
                return (
                  <button
                    key={step.number}
                    onClick={() => handleStepClick(index)}
                    className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-memora-primary/30 ${
                      isActive 
                        ? 'bg-gradient-to-br from-memora-primary to-memora-secondary shadow-2xl scale-110' 
                        : isPassed 
                        ? 'bg-memora-primary/80 shadow-lg' 
                        : 'bg-white/10 backdrop-blur-sm border-2 border-white/20 hover:border-memora-primary/50'
                    }`}
                  >
                    <IconComponent className={`w-7 h-7 transition-colors duration-300 ${
                      isActive || isPassed ? 'text-white' : 'text-memora-primary'
                    }`} />
                    
                    {/* Step Number Badge */}
                    <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      isActive 
                        ? 'bg-white text-memora-primary shadow-lg' 
                        : isPassed 
                        ? 'bg-memora-primary text-white' 
                        : 'bg-white/20 text-white/60'
                    }`}>
                      {step.number}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Step Content */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-white/10 shadow-2xl">
              <div className="text-center">

                
                <h3 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
                  {steps[activeStep].title}
                </h3>
                
                <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
                  {steps[activeStep].description}
                </p>
                
                <p className="text-lg text-muted-foreground/80 max-w-2xl mx-auto leading-relaxed">
                  {steps[activeStep].details}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center space-x-2 surface-1 px-6 py-3 rounded-full shadow-lg">
            <Sparkles className="w-5 h-5 text-secondary" />
            <span className="text-muted-foreground font-medium">
              Processo 100% automatizado com IA avançada
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
