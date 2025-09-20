import { Check, Heart, Mic, Headphones, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
}

// Mapeamento dos novos textos e ícones para cada etapa
const stepConfig = [
  {
    label: "História",
    icon: Heart,
    description: "Compartilhe a ocasião e os sentimentos que quer transformar em música.",
    microcopy: "Conte sua história"
  },
  {
    label: "Canção",
    icon: Mic,
    description: "Veja a letra criada pela IA com base na sua história.",
    microcopy: "Sua letra está pronta"
  },
  {
    label: "Estilo",
    icon: Headphones,
    description: "Escolha o gênero musical e a voz que combinam com o momento.",
    microcopy: "Defina o som perfeito"
  },
  {
    label: "Sua música",
    icon: Play,
    description: "Ouça a prévia e receba a versão final da sua canção.",
    microcopy: "Sua música está sendo criada"
  }
];

export default function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="w-full max-w-4xl mx-auto mb-12">
      {/* Container principal com efeito de vidro */}
      <div className="relative backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-6 shadow-2xl">
        {/* Linha de progresso com gradiente animado */}
        <div className="absolute top-1/2 left-8 right-8 h-1 bg-gray-200/30 rounded-full transform -translate-y-1/2">
          <div 
            className="h-full bg-gradient-to-r from-[#7B3FE4] to-[#FEC641] rounded-full transition-all duration-1000 ease-out"
            style={{ 
              width: `${currentStep === 0 ? '0%' : `${(currentStep / (steps.length - 1)) * 100}%`}` 
            }}
          />
        </div>

        {/* Steps */}
        <div className="flex items-center justify-between relative z-10">
          {steps.map((step, index) => {
            const config = stepConfig[index];
            const Icon = config.icon;
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const isFuture = index > currentStep;

            return (
              <div key={index} className="flex flex-col items-center group">
                {/* Step Circle com ícone */}
                <div className="relative">
                  <div
                    className={cn(
                      "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 ease-out backdrop-blur-sm border-2 relative overflow-hidden",
                      isCompleted && "bg-[#FEC641] border-[#FEC641] shadow-lg shadow-[#FEC641]/30",
                      isCurrent && "bg-[#7B3FE4] border-[#7B3FE4] shadow-lg shadow-[#7B3FE4]/40 scale-110",
                      isFuture && "bg-white/10 border-[#7A7A7A] backdrop-blur-md"
                    )}
                    title={config.description}
                  >
                    {/* Número do step */}
                    <span 
                      className={cn(
                        "absolute top-0.5 right-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold leading-none",
                        isCompleted && "bg-white text-[#FEC641]",
                        isCurrent && "bg-white text-[#7B3FE4]",
                        isFuture && "bg-[#7A7A7A] text-white"
                      )}
                    >
                      {index + 1}
                    </span>
                    
                    {/* Ícone ou checkmark */}
                    {isCompleted ? (
                      <Check className="w-7 h-7 text-white" />
                    ) : (
                      <Icon 
                        className={cn(
                          "w-7 h-7 transition-colors duration-300",
                          isCurrent && "text-white",
                          isFuture && "text-[#7A7A7A]"
                        )} 
                      />
                    )}
                  </div>
                </div>

                {/* Label com tipografia Sora Semibold */}
                <div className="mt-4 text-center">
                  <p
                     className={cn(
                       "font-heading font-semibold text-base transition-all duration-300",
                       isCompleted && "text-[#FEC641]",
                       isCurrent && "text-white scale-105",
                       isFuture && "text-[#7A7A7A]"
                     )}
                   >
                    {config.label}
                  </p>
                  
                  {/* Microcopy dinâmica para etapa ativa */}
                  {isCurrent && (
                    <p className="text-xs text-white/80 mt-1 animate-pulse">
                      {config.microcopy}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}