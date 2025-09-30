import { Sparkles } from "lucide-react";
import { LiquidGlassButton } from "@/components/ui/LiquidGlassButton";
import { GlobalTextField } from "@/components/ui/GlobalTextField";
import { HeroCard } from "@/components/ui/HeroCard";
import { useNavigate } from "react-router-dom";
import { useMusicStore } from "@/store/musicStore";
import { useAuthStore } from "@/store/authStore";
import ParticlesAndWaves from "./ParticlesAndWaves";
import { useState } from "react";
import { useTranslation } from '@/i18n/hooks/useTranslation';

const Hero = () => {
  const { t } = useTranslation('hero');
  const navigate = useNavigate();
  const { startNewCreationFlow } = useMusicStore();
  const [recipientName, setRecipientName] = useState("");

  const handleCreateMusicClick = async () => {
    const { token } = useAuthStore.getState();
    const queryParam = recipientName.trim() ? `?para=${encodeURIComponent(recipientName.trim())}` : '';
    navigate(`/criar${queryParam}`);
    await startNewCreationFlow(navigate, token);
  };



  return (
    <section className="relative min-h-screen flex items-center justify-center" style={{ marginTop: '-164px', paddingTop: '164px' }}>
      {/* Particles and Waves Animation Background */}
      <ParticlesAndWaves className="opacity-50" />
      
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/8 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#7B3FE4]/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 xs:px-6 sm:px-8 lg:px-12 overflow-hidden">
        <div className="flex flex-col items-center text-center w-full gap-10">
          {/* Headline - Hierarquia responsiva corrigida */}
          <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-white leading-tight px-4 xs:px-6 sm:px-8 break-words hyphens-auto max-w-full overflow-hidden">
            <span className="block xs:inline">{t('headline.part1')}</span>{" "}
            <span className="bg-gradient-yellow-purple bg-clip-text text-transparent break-words">{t('headline.feelings')}</span>{" "}
            <span className="block xs:inline">{t('headline.part2')}</span> <span className="bg-gradient-yellow-purple bg-clip-text text-transparent break-words">{t('headline.gift')}</span>
          </h1>

          {/* Subheadline - Padding responsivo implementado */}
          <p className="text-lg xs:text-xl sm:text-2xl md:text-3xl text-white/90 leading-relaxed max-w-4xl px-4 xs:px-6 sm:px-8 break-words">
            <span className="block sm:inline">{t('subheadline.part1')}</span>
            <span className="block sm:inline">{t('subheadline.part2')}</span>
          </p>

          {/* CTA Card */}
          <div className="relative mt-8 text-center">
            <HeroCard>
              <div className="text-center space-y-3">
                <h3 className="text-white xs:text-lg sm:text-xl md:text-2xl font-bold font-heading leading-tight">
                  {t('cta.title')}
                </h3>
              </div>
              
              {/* Input and Primary CTA */}
              <div className="flex flex-col lg:flex-row gap-4 justify-center items-center lg:items-end w-full">
                <div className="flex flex-col w-full lg:w-auto">
                  <GlobalTextField
                    id="recipient-name"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder={t('form.placeholder')}
                    aria-describedby="recipient-name-description"
                  />
                  <span id="recipient-name-description" className="sr-only">
                    {t('form.ariaDescription')}
                  </span>
                </div>
                
                <LiquidGlassButton
                  data-attr="hero-cta-primary"
                  onClick={handleCreateMusicClick}
                  className="w-full lg:w-auto hover:-translate-y-1"
                >
                  <Sparkles className="mr-3 h-6 w-6" />
                  {t('cta.button')}
                </LiquidGlassButton>
              </div>
              
              {/* Free message */}
              <p className="text-white/70 text-sm font-medium text-center">
                {t('cta.freeMessage')}
              </p>
            </HeroCard>
          </div>


        </div>
      </div>


    </section>
  );
};

export default Hero;
