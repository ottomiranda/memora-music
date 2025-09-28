import { Heart, Instagram, Facebook, Youtube, ArrowUp } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import FeedbackPopup from "@/components/memora/FeedbackPopup";
import LanguageSelector from "@/components/LanguageSelector";
import { NAVBAR_TOTAL_OFFSET } from '@/constants/layout';
import { useLocalizedRoutes } from '@/hooks/useLocalizedRoutes';

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
    <footer className="py-16 text-foreground">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Logo and Description */}
          <div className="md:col-span-2">
            <div className="flex items-center mb-6">
              <img 
                src="/memora_logo_white.svg" 
                alt="Memora Music" 
                className="h-8 w-auto"
              />
            </div>
            <p className="text-gray-400 mb-6 leading-relaxed">
              {t('footer.description')}
            </p>
            <button
              onClick={() => setFeedbackOpen(true)}
              className="mt-6 text-left bg-primary/10 border border-primary/20 rounded-xl p-4 max-w-md text-secondary text-xs font-medium hover:bg-primary/15 transition"
            >
              {t('footer.feedback')}
            </button>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">{t('footer.quickLinks.title')}</h3>
            <ul className="space-y-2">
              <li>
                <button onClick={() => scrollToSection('como-funciona')} className="text-white/50 hover:text-white transition-colors text-left">
                  {t('footer.quickLinks.howItWorks')}
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('precos')} className="text-white/50 hover:text-white transition-colors text-left">
                  {t('footer.quickLinks.pricing')}
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('exemplos')} className="text-white/50 hover:text-white transition-colors text-left">
                  {t('footer.quickLinks.examples')}
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('faq')} className="text-white/50 hover:text-white transition-colors text-left">
                  {t('footer.quickLinks.faq')}
                </button>
              </li>
            </ul>
          </div>

          {/* Legal */}
            <div>
              <h3 className="font-semibold text-white mb-4">{t('footer.legal.title')}</h3>
              <ul className="space-y-2">
                <li>
                  <Link to={buildPath('termsOfUse')} className="text-white/50 hover:text-white transition-colors">
                    {t('footer.legal.termsOfUse')}
                  </Link>
                </li>
                <li>
                  <Link to={buildPath('privacyPolicy')} className="text-white/50 hover:text-white transition-colors">
                    {t('footer.legal.privacyPolicy')}
                  </Link>
                </li>
                <li>
                  <Link to="/cookies" className="text-white/50 hover:text-white transition-colors">
                    {t('footer.legal.cookies')}
                  </Link>
                </li>
              </ul>
            </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-white/20 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-6 md:space-y-0">
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6">
              <p className="text-white/80 text-sm">
                {t('footer.copyright')}
              </p>
              <div className="flex items-center space-x-4">
                <span className="text-white/80 text-xs">
                  {t('footer.madeWith.text')}
                </span>
                <Heart className="w-4 h-4 text-memora-coral fill-current" />
                <span className="text-white/80 text-xs">
                  {t('footer.madeWith.purpose')}
                </span>
              </div>
            </div>

            {/* Language Selector, Scroll to top and Social Links */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <LanguageSelector />
              <button
                onClick={scrollToTop}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 text-sm font-medium transition-colors"
                aria-label={t('footer.altText.backToTopButton')}
              >
                <ArrowUp className="h-4 w-4" />
                {t('footer.backToTop')}
              </button>
              <div className="flex items-center space-x-4">
                <a
                  href="#"
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <Instagram className="h-5 w-5 text-white" />
                </a>
                <a
                  href="#"
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <Facebook className="h-5 w-5 text-white" />
                </a>
                <a
                  href="#"
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                </a>
                <a
                  href="#"
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
                  <Youtube className="h-5 w-5 text-white" />
                </a>
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
