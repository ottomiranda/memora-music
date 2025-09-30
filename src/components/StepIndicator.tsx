import { Check, Heart, Mic, Headphones, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
}

// Mapeamento dos ícones para cada etapa
const stepIcons = [Heart, Mic, Headphones, Play];
const stepKeys = ['story', 'lyrics', 'style', 'music'];

export default function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  const { t } = useTranslation('common');
  
  return (
    <div className="w-full max-w-4xl mx-auto mb-8 xs:mb-12">
      {/* Container principal com efeito de vidro - Layout responsivo */}
      <div className="relative backdrop-blur-md bg-white/10 border border-white/20 rounded-xl xs:rounded-2xl p-4 xs:p-6 shadow-2xl">
        {/* Linha de progresso - Horizontal em desktop, vertical em mobile */}
        <div className="hidden sm:block absolute top-1/2 left-8 right-8 h-1 bg-gray-200/30 rounded-full transform -translate-y-1/2">
          <div 
            className="h-full bg-gradient-to-r from-[#7B3FE4] to-[#FEC641] rounded-full transition-all duration-1000 ease-out"
            style={{ 
              width: `${currentStep === 0 ? '0%' : `${(currentStep / (steps.length - 1)) * 100}%`}` 
            }}
          />
        </div>
        
        {/* Linha de progresso vertical para mobile */}
        <div className="sm:hidden absolute left-1/2 top-4 bottom-4 w-1 bg-gray-200/30 rounded-full transform -translate-x-1/2">
          <div 
            className="w-full bg-gradient-to-b from-[#7B3FE4] to-[#FEC641] rounded-full transition-all duration-1000 ease-out"
            style={{ 
              height: `${currentStep === 0 ? '0%' : `${(currentStep / (steps.length - 1)) * 100}%`}` 
            }}
          />
        </div>

        {/* Steps - Layout responsivo: vertical em mobile, horizontal em desktop */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between relative z-10 space-y-6 sm:space-y-0">
          {steps.map((step, index) => {
            const Icon = stepIcons[index];
            const stepKey = stepKeys[index];
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const isFuture = index > currentStep;

            return (
              <div key={index} className="flex flex-row sm:flex-col items-center group w-full sm:w-auto">
                {/* Step Circle com ícone - Área de toque mínima 44px */}
                <div className="relative flex-shrink-0">
                  <div
                    className={cn(
                      "w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all duration-500 ease-out backdrop-blur-sm border-2 relative overflow-hidden touch-manipulation",
                      "min-w-[44px] min-h-[44px]", // Área de toque mínima
                      isCompleted && "bg-[#FEC641] border-[#FEC641] shadow-lg shadow-[#FEC641]/30",
                      isCurrent && "bg-[#7B3FE4] border-[#7B3FE4] shadow-lg shadow-[#7B3FE4]/40 scale-105 sm:scale-110",
                      isFuture && "bg-white/10 border-[#7A7A7A] backdrop-blur-md"
                    )}
                    title={t(`steps.${stepKey}.description`)}
                  >
                    {/* Número do step - Responsivo */}
                    <span 
                      className={cn(
                        "absolute top-0.5 right-0.5 w-5 h-5 xs:w-6 xs:h-6 rounded-full flex items-center justify-center text-xs font-bold leading-none",
                        isCompleted && "bg-white text-[#FEC641]",
                        isCurrent && "bg-white text-[#7B3FE4]",
                        isFuture && "bg-[#7A7A7A] text-white"
                      )}
                    >
                      {index + 1}
                    </span>
                    
                    {/* Ícone ou checkmark - Tamanhos responsivos */}
                    {isCompleted ? (
                      <Check className="w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 text-white" />
                    ) : (
                      <Icon 
                        className={cn(
                          "w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 transition-colors duration-300",
                          isCurrent && "text-white",
                          isFuture && "text-[#7A7A7A]"
                        )} 
                      />
                    )}
                  </div>
                </div>

                {/* Label com tipografia Sora Semibold - Layout responsivo */}
                <div className="ml-4 sm:ml-0 sm:mt-4 text-left sm:text-center flex-1 sm:flex-initial">
                  <p
                     className={cn(
                       "font-heading font-semibold text-sm xs:text-base transition-all duration-300",
                       isCompleted && "text-[#FEC641]",
                       isCurrent && "text-white sm:scale-105",
                       isFuture && "text-[#7A7A7A]"
                     )}
                   >
                    {t(`steps.${stepKey}.label`)}
                  </p>
                  
                  {/* Microcopy dinâmica para etapa ativa - Oculta em mobile para economizar espaço */}
                  {isCurrent && (
                    <p className="hidden sm:block text-xs text-white/80 mt-1 animate-pulse">
                      {t(`steps.${stepKey}.microcopy`)}
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