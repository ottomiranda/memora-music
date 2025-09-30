import { Heart, Instagram, Facebook, Youtube, ArrowUp } from "lucide-react";
import { useState, useEffect, useCallback, memo } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import FeedbackPopup from "@/components/memora/FeedbackPopup";
import LanguageSelector from "@/components/LanguageSelector";
import { AccessibilityMenu } from "@/components/accessibility/AccessibilityMenu";
import { NAVBAR_TOTAL_OFFSET } from '@/constants/layout';
import { useLocalizedRoutes } from '@/hooks/useLocalizedRoutes';

// Cached Quick Links Section
const QuickLinksSection = memo(({ scrollToSection }: { scrollToSection: (sectionId: string) => void }) => {
  const { t } = useTranslation();
  
  return (
    <div className="order-3 sm:order-2">
      <h3 className="font-semibold text-white mb-3 xs:mb-4 text-sm xs:text-base">{t('footer.quickLinks.title')}</h3>
      <ul className="space-y-1 xs:space-y-2">
        <li>
          <button 
            onClick={() => scrollToSection('como-funciona')} 
            className="text-white/50 hover:text-white transition-colors text-left w-full py-1 xs:py-0 text-sm xs:text-base touch-manipulation min-h-[44px] sm:min-h-auto flex items-center"
          >
            {t('footer.quickLinks.howItWorks')}
          </button>
        </li>
        <li>
          <button 
            onClick={() => scrollToSection('precos')} 
            className="text-white/50 hover:text-white transition-colors text-left w-full py-1 xs:py-0 text-sm xs:text-base touch-manipulation min-h-[44px] sm:min-h-auto flex items-center"
          >
            {t('footer.quickLinks.pricing')}
          </button>
        </li>
        <li>
          <button 
            onClick={() => scrollToSection('exemplos')} 
            className="text-white/50 hover:text-white transition-colors text-left w-full py-1 xs:py-0 text-sm xs:text-base touch-manipulation min-h-[44px] sm:min-h-auto flex items-center"
          >
            {t('footer.quickLinks.examples')}
          </button>
        </li>
        <li>
          <button 
            onClick={() => scrollToSection('faq')} 
            className="text-white/50 hover:text-white transition-colors text-left w-full py-1 xs:py-0 text-sm xs:text-base touch-manipulation min-h-[44px] sm:min-h-auto flex items-center"
          >
            {t('footer.quickLinks.faq')}
          </button>
        </li>
      </ul>
    </div>
  );
});

// Legal Section
const LegalSection = memo(() => {
  const { t } = useTranslation();
  const { buildPath } = useLocalizedRoutes();
  
  return (
    <div className="order-4 sm:order-3">
      <h3 className="font-semibold text-white mb-3 xs:mb-4 text-sm xs:text-base">{t('footer.legal.title')}</h3>
      <ul className="space-y-1 xs:space-y-2">
        <li>
          <Link 
            to={buildPath('termsOfUse')} 
            className="text-white/50 hover:text-white transition-colors block py-1 xs:py-0 text-sm xs:text-base touch-manipulation min-h-[44px] sm:min-h-auto flex items-center"
          >
            {t('footer.legal.termsOfUse')}
          </Link>
        </li>
        <li>
          <Link 
            to={buildPath('privacyPolicy')} 
            className="text-white/50 hover:text-white transition-colors block py-1 xs:py-0 text-sm xs:text-base touch-manipulation min-h-[44px] sm:min-h-auto flex items-center"
          >
            {t('footer.legal.privacyPolicy')}
          </Link>
        </li>
        <li>
          <Link 
            to="/cookies" 
            className="text-white/50 hover:text-white transition-colors block py-1 xs:py-0 text-sm xs:text-base touch-manipulation min-h-[44px] sm:min-h-auto flex items-center"
          >
            {t('footer.legal.cookies')}
          </Link>
        </li>
      </ul>
    </div>
  );
});

// Cached Social Links
const SocialLinks = memo(() => {
  return (
    <div className="flex items-center space-x-2 xs:space-x-3">
      <a
        href="https://www.instagram.com/memoramusicapp"
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 xs:p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label="Instagram"
      >
        <Instagram className="h-4 xs:h-5 w-4 xs:w-5 text-white" />
      </a>
      <a
        href="https://www.facebook.com/profile.php?id=61581609839139"
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 xs:p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label="Facebook"
      >
        <Facebook className="h-4 xs:h-5 w-4 xs:w-5 text-white" />
      </a>
      <a
        href="https://www.tiktok.com/@memora.music"
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 xs:p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label="TikTok"
      >
        <svg className="h-4 xs:h-5 w-4 xs:w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
        </svg>
      </a>
      <a
        href="https://www.youtube.com/@Memora-Music"
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 xs:p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label="YouTube"
      >
        <Youtube className="h-4 xs:h-5 w-4 xs:w-5 text-white" />
      </a>
    </div>
  );
});

const Footer = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  const location = useLocation();
  const navigate = useNavigate();
  const { buildPath } = useLocalizedRoutes();

  const [isFeedbackOpen, setFeedbackOpen] = useState(false);

  const scrollToTop = useCallback(() => {
    const startY = window.pageYOffset;
    const duration = 600;
    const startTime = performance.now();

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);

      window.scrollTo(0, startY * (1 - eased));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, []);

  const performScrollToSection = useCallback((sectionId: string) => {
    let targetElement: Element | null = null;

    const sectionElement = document.getElementById(sectionId);
    if (sectionElement) {
      targetElement = sectionElement;
    }

    if (targetElement) {
      const elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - NAVBAR_TOTAL_OFFSET;
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    }
  }, []);

  const scrollToSection = (sectionId: string) => {
    if (location.pathname !== '/') {
      navigate('/', { state: { scrollTo: sectionId } });
      return;
    }

    performScrollToSection(sectionId);
  };

  useEffect(() => {
    const state = location.state as ({ scrollTo?: string } & Record<string, unknown>) | null;
    if (location.pathname === '/' && state?.scrollTo) {
      const timer = window.setTimeout(() => {
        performScrollToSection(state.scrollTo!);
        const { scrollTo, ...rest } = state;
        const hasAdditionalState = Object.keys(rest).length > 0;
        navigate(location.pathname, { replace: true, state: hasAdditionalState ? rest : undefined });
      }, 100);
      return () => window.clearTimeout(timer);
    }
  }, [location.pathname, location.state, navigate, performScrollToSection]);

  return (
    <footer className="py-12 xs:py-16 text-foreground">
      <div className="container mx-auto px-4 xs:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 xs:gap-8 mb-8">
          {/* Logo and Description */}
          <div className="sm:col-span-2 lg:col-span-2">
            <div className="flex items-center mb-4 xs:mb-6">
              <img 
                src="/memora_logo_white.svg" 
                alt="Memora Music" 
                className="h-6 xs:h-8 w-auto"
              />
            </div>
            <p className="text-gray-400 mb-4 xs:mb-6 leading-relaxed text-sm xs:text-base">
              {t('footer.description')}
            </p>
            <button
              onClick={() => setFeedbackOpen(true)}
              className="w-full sm:w-auto text-left bg-primary/10 border border-primary/20 rounded-xl p-3 xs:p-4 max-w-md text-secondary text-xs xs:text-sm font-medium hover:bg-primary/15 transition-all duration-200 touch-manipulation min-h-[44px] flex items-center"
            >
              {t('footer.feedback')}
            </button>
          </div>

          {/* Cached Quick Links */}
          <QuickLinksSection scrollToSection={scrollToSection} />

          {/* Cached Legal */}
          <LegalSection />
        </div>

        {/* Bottom Section */}
        <div className="border-t border-white/20 pt-6 xs:pt-8">
          <div className="flex flex-col lg:flex-row items-center justify-between space-y-4 xs:space-y-6 lg:space-y-0">
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 lg:space-x-6 text-center sm:text-left">
              <p className="text-white/80 text-xs xs:text-sm">
                {t('footer.copyright')}
              </p>
              <div className="flex items-center space-x-2 xs:space-x-4">
                <span className="text-white/80 text-xs">
                  {t('footer.madeWith.text')}
                </span>
                <Heart className="w-3 xs:w-4 h-3 xs:h-4 text-memora-coral fill-current" />
                <span className="text-white/80 text-xs">
                  {t('footer.madeWith.purpose')}
                </span>
              </div>
            </div>

            {/* Accessibility Menu, Language Selector, Scroll to top and Social Links */}
            <div className="flex flex-col xs:flex-row items-center gap-3 xs:gap-4 w-full lg:w-auto">
              <div className="order-1 xs:order-1">
                <AccessibilityMenu variant="footer" className="" />
              </div>
              <div className="order-2 xs:order-2">
                <LanguageSelector />
              </div>
              <button
                onClick={scrollToTop}
                className="order-3 xs:order-3 flex items-center gap-2 px-3 xs:px-4 py-2 xs:py-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 text-xs xs:text-sm font-medium transition-colors touch-manipulation min-h-[44px]"
                aria-label={t('footer.altText.backToTopButton')}
              >
                <ArrowUp className="h-3 xs:h-4 w-3 xs:w-4" />
                <span className="hidden xs:inline">{t('footer.backToTop')}</span>
              </button>
              {/* Cached Social Links */}
              <div className="order-4 xs:order-4">
                <SocialLinks />
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Modal */}
        <FeedbackPopup isOpen={isFeedbackOpen} onClose={() => setFeedbackOpen(false)} />
      </div>
    </footer>
  );
};

export default Footer;
