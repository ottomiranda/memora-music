import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useComponentCache } from "@/hooks/useComponentCache";
import heroImage from "@/assets/hero-music.jpg";

const HeroBackground = memo(() => {
  const { t } = useTranslation('common');
  
  const { component } = useComponentCache(
    'hero-background',
    () => (
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt={t('heroSection.altText.heroImage')}
          className="w-full h-full object-cover opacity-20"
          loading="eager"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/30 to-background"></div>
      </div>
    ),
    {
      ttl: 30 * 60 * 1000, // 30 minutes - static background
      dependencies: [t('heroSection.altText.heroImage')],
      enableMemoryCache: true,
    }
  );
  
  return component;
});

HeroBackground.displayName = 'HeroBackground';

export default HeroBackground;