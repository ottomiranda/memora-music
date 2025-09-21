import { Check, Clock, Music, Mic, Download, Sparkles } from "lucide-react";
import { useCreationStatus } from "../../hooks/useCreationStatus";
import SectionTitle from '../ui/SectionTitle';
import SectionSubtitle from '../ui/SectionSubtitle';
import { LiquidGlassButton } from "@/components/ui/LiquidGlassButton";
import { LiquidGlassCard } from "@/components/ui/LiquidGlassCard";
import { useMusicStore } from "@/store/musicStore";
import { useAuthStore } from "@/store/authStore";
import { useNavigate } from "react-router-dom";

const PlanSection = ({ id }: { id?: string }) => {
  const { isFree: isFirstSong, isLoading, error } = useCreationStatus();
  const { startNewCreationFlow } = useMusicStore();
  const { token } = useAuthStore();
  const navigate = useNavigate();

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
    <section id={id} className="py-[120px]">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <SectionTitle>
            Um presente que <span className="bg-gradient-to-r from-yellow-400 via-purple-500 to-purple-600 bg-clip-text text-transparent">toca</span> o <span className="bg-gradient-to-r from-yellow-400 via-purple-500 to-purple-600 bg-clip-text text-transparent">coração</span>
          </SectionTitle>
          <SectionSubtitle>Crie memórias musicais únicas que ficarão para sempre</SectionSubtitle>
        </div>

        {/* Plan Card */}
        <div className="max-w-2xl mx-auto pt-12 overflow-visible">
          <LiquidGlassCard className="relative overflow-visible">
            {/* Badge */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[100]">
              <div className="bg-memora-secondary px-7 py-2 rounded-full shadow-lg border border-white/40 text-center">
                <span className="font-heading font-bold text-sm" style={{color: '#08060D'}}>
                  🎉 Primeira música é grátis!
                </span>
              </div>
            </div>

            <div className="pt-16 pb-8 px-8 sm:px-12">
              {/* Plan Name */}
              <div className="text-center mb-8">
                <h3 className="text-2xl sm:text-3xl font-heading font-bold text-white mb-2">
                  AI Premium
                </h3>
                <div className="flex items-center justify-center space-x-2">
                  {isLoading ? (
                    <div className="text-4xl sm:text-5xl font-heading font-bold text-muted-foreground animate-pulse">
                      R$ --
                    </div>
                  ) : (
                    <span className="text-4xl sm:text-5xl font-heading font-bold text-primary">
                      {isFirstSong ? "R$ 0" : "R$ 149"}
                    </span>
                  )}
                  <div className="text-left">
                    {!isLoading && isFirstSong && (
                      <div className="text-muted-foreground line-through text-lg">
                        R$ 149
                      </div>
                    )}
                    <div className="text-sm text-white">
                      por música
                    </div>
                  </div>
                </div>
                {error && (
                  <div className="text-xs text-orange-600 mt-2">
                    Erro ao carregar preço. Usando valor padrão.
                  </div>
                )}
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
                      <span className="text-white/80 font-medium">
                        {benefit.text}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* CTA Button */}
              <div className="text-center mb-6">
                <LiquidGlassButton
                  data-attr="plan-cta-button"
                  className="w-full font-heading font-bold"
                  onClick={async () => {
                    try {
                      await startNewCreationFlow(navigate, token || null);
                    } catch (error) {
                      console.error('[PlanSection] erro ao iniciar fluxo de criação', error);
                      navigate('/criar');
                    }
                  }}
                >
                  <Sparkles className="mr-3 h-5 w-5" />
                  Crie sua música agora
                </LiquidGlassButton>
              </div>

              {/* Timer */}
              <div className="flex items-center justify-center space-x-2 text-white/50 text-sm">
                <Clock className="w-4 h-4" />
                <span>Oferta limitada ao período de lançamento</span>
              </div>


            </div>
          </LiquidGlassCard>
        </div>

        {/* Bottom Features */}
        <div className="mt-16 grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <h4 className="font-heading font-bold text-white mb-1">
              Entrega Rápida
            </h4>
            <p className="text-sm text-white/50">
              Sua música fica pronta em menos de 5 minutos
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6 text-secondary" />
            </div>
            <h4 className="font-heading font-bold text-white mb-1">
              100% Única
            </h4>
            <p className="text-sm text-white/50">
              Cada música é criada exclusivamente para você
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-accent-coral/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Download className="w-6 h-6 text-accent-coral" />
            </div>
            <h4 className="font-heading font-bold text-white mb-1">
              Formato MP3
            </h4>
            <p className="text-sm text-white/50">
              Compatível com todos os dispositivos
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlanSection;
