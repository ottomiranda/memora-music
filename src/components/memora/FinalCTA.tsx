import { Music, Sparkles } from "lucide-react";
import { LiquidGlassButton } from "@/components/ui/LiquidGlassButton";
import { useMusicStore } from "@/store/musicStore";
import { useAuthStore } from "@/store/authStore";
import { useNavigate } from "react-router-dom";
import { useTranslation } from '@/i18n/hooks/useTranslation';

const FinalCTA = ({ onOpenAuth }: { onOpenAuth: () => void }) => {
  const { t } = useTranslation('finalCta');
  const { startNewCreationFlow } = useMusicStore();
  const { token } = useAuthStore();
  const navigate = useNavigate();

  return (
    <section className="py-[120px] bg-gradient-to-br from-memora-primary via-memora-primary/95 to-memora-primary/90 relative overflow-hidden">
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
          <h2 className="text-3xl sm:text-4xl lg:text-6xl font-heading font-bold text-memora-secondary mb-6 leading-tight">
            {t('header.surprise')} <span className="bg-gradient-to-r from-yellow-400 via-purple-500 to-purple-600 bg-clip-text text-transparent">{t('header.lovedOne')}</span> {t('header.with')} <span className="bg-gradient-to-r from-yellow-400 via-purple-500 to-purple-600 bg-clip-text text-transparent">{t('header.song')}</span> {t('header.madeFor')} <span className="bg-gradient-to-r from-yellow-400 via-purple-500 to-purple-600 bg-clip-text text-transparent">{t('header.them')}</span>
          </h2>
          <p className="text-xl lg:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
            {t('header.subtitle')}
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <LiquidGlassButton
            data-attr="final-cta-create-music"
            className="font-heading font-bold text-lg px-10"
            onClick={async () => {
              try {
                await startNewCreationFlow(navigate, token || null);
              } catch (error) {
                console.error('[FinalCTA] erro ao iniciar fluxo de criação', error);
                onOpenAuth();
              }
            }}
          >
            {t('button.createNow')}
            <Sparkles className="ml-3 h-6 w-6" />
          </LiquidGlassButton>
        </div>

        {/* Additional Info */}
        <div className="mt-12 pt-8 border-t border-white/20">
          <div className="grid sm:grid-cols-3 gap-8 text-center">
            <div className="space-y-2">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Music className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-heading font-bold text-white text-lg">
                {t('features.personalized.title')}
              </h3>
              <p className="text-white/50 text-sm">
                {t('features.personalized.description')}
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                  <span className="text-memora-primary text-xs font-bold">IA</span>
                </div>
              </div>
              <h3 className="font-heading font-bold text-white text-lg">
                {t('features.technology.title')}
              </h3>
              <p className="text-white/50 text-sm">
                {t('features.technology.description')}
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <div className="w-6 h-6 text-white font-bold text-lg">
                  ♪
                </div>
              </div>
              <h3 className="font-heading font-bold text-white text-lg">
                {t('features.quality.title')}
              </h3>
              <p className="text-white/50 text-sm">
                {t('features.quality.description')}
              </p>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 flex flex-wrap justify-center items-center gap-8 text-white/60 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full" />
            <span>{t('trust.freeLaunch')}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full" />
            <span>{t('trust.noCommitment')}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full" />
            <span>{t('trust.quickResult')}</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
