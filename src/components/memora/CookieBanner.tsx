import { useState, useEffect } from "react";
import { X, Settings, Shield, BarChart3, Target } from "lucide-react";

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

const CookieBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false
  });

  useEffect(() => {
    // Check if user has already made a choice
    const cookieConsent = localStorage.getItem('memora-cookie-consent');
    if (!cookieConsent) {
      // Show banner after a short delay
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      // Load saved preferences
      try {
        const savedPreferences = JSON.parse(cookieConsent);
        setPreferences(savedPreferences);
      } catch (error) {
        console.error('Error parsing cookie preferences:', error);
      }
    }
  }, []);

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem('memora-cookie-consent', JSON.stringify(prefs));
    setPreferences(prefs);
    setShowBanner(false);
    setShowModal(false);
    
    // Here you would typically initialize analytics/marketing scripts based on preferences
    if (prefs.analytics) {
      // Initialize analytics (e.g., Google Analytics)
      console.log('Analytics enabled');
    }
    if (prefs.marketing) {
      // Initialize marketing pixels (e.g., Facebook Pixel)
      console.log('Marketing enabled');
    }
  };

  const acceptAll = () => {
    savePreferences({
      necessary: true,
      analytics: true,
      marketing: true
    });
  };

  const rejectAll = () => {
    savePreferences({
      necessary: true,
      analytics: false,
      marketing: false
    });
  };

  const openCustomize = () => {
    setShowModal(true);
  };

  const handleCustomSave = () => {
    savePreferences(preferences);
  };

  const togglePreference = (key: keyof CookiePreferences) => {
    if (key === 'necessary') return; // Necessary cookies cannot be disabled
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Cookie Banner */}
      <div className="fixed bottom-0 left-0 right-0 surface-1 shadow-2xl z-50 transform transition-transform duration-500">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <Shield className="w-5 h-5 text-memora-primary" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-foreground text-sm mb-1">
                    Cookies e Privacidade
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Usamos cookies para melhorar sua experiência, analisar o tráfego e personalizar conteúdo. 
                    Você pode escolher quais cookies aceitar.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <button
                onClick={acceptAll}
                className="bg-memora-primary hover:bg-memora-primary/90 text-white font-heading font-bold py-2 px-4 rounded-xl transition-colors duration-200 text-sm"
                data-attr="cookie-accept-all"
              >
                Aceitar todos
              </button>
              <button
                onClick={rejectAll}
                className="border border-white/20 hover:border-memora-primary text-muted-foreground hover:text-memora-primary font-heading font-bold py-2 px-4 rounded-xl transition-colors duration-200 text-sm"
                data-attr="cookie-reject-all"
              >
                Rejeitar todos
              </button>
              <button
                onClick={openCustomize}
                className="border border-memora-primary text-memora-primary hover:bg-memora-primary hover:text-white font-heading font-bold py-2 px-4 rounded-xl transition-colors duration-200 text-sm flex items-center space-x-2"
                data-attr="cookie-customize"
              >
                <Settings className="w-4 h-4" />
                <span>Personalizar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Customization Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="surface-2 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-2xl font-heading font-bold text-foreground">
                Preferências de Cookies
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors duration-200"
                aria-label="Fechar modal"
              >
                <X className="w-6 h-6 text-muted-foreground" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              <p className="text-muted-foreground leading-relaxed">
                Personalize suas preferências de cookies. Você pode alterar essas configurações a qualquer momento.
              </p>

              {/* Cookie Categories */}
              <div className="space-y-4">
                {/* Necessary Cookies */}
                <div className="bg-white/5 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Shield className="w-5 h-5 text-memora-primary" />
                      <h3 className="font-heading font-bold text-foreground">
                        Cookies Necessários
                      </h3>
                    </div>
                    <div className="bg-memora-primary text-white text-xs px-2 py-1 rounded-full font-bold">
                      SEMPRE ATIVO
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Estes cookies são essenciais para o funcionamento do site e não podem ser desativados. 
                    Eles são geralmente definidos em resposta a ações suas, como fazer login ou preencher formulários.
                  </p>
                </div>

                {/* Analytics Cookies */}
                <div className="bg-white/5 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <BarChart3 className="w-5 h-5 text-memora-turquoise" />
                      <h3 className="font-heading font-bold text-foreground">
                        Cookies de Analytics
                      </h3>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.analytics}
                        onChange={() => togglePreference('analytics')}
                        className="sr-only"
                      />
                      <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${
                        preferences.analytics ? 'bg-memora-primary' : 'bg-memora-gray/30'
                      }`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                          preferences.analytics ? 'translate-x-5' : 'translate-x-0.5'
                        } mt-0.5`} />
                      </div>
                    </label>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Estes cookies nos ajudam a entender como os visitantes interagem com o site, 
                    coletando informações de forma anônima para melhorar a experiência do usuário.
                  </p>
                </div>

                {/* Marketing Cookies */}
                <div className="bg-white/5 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Target className="w-5 h-5 text-memora-coral" />
                      <h3 className="font-heading font-bold text-foreground">
                        Cookies de Marketing
                      </h3>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.marketing}
                        onChange={() => togglePreference('marketing')}
                        className="sr-only"
                      />
                      <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${
                        preferences.marketing ? 'bg-memora-primary' : 'bg-memora-gray/30'
                      }`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                          preferences.marketing ? 'translate-x-5' : 'translate-x-0.5'
                        } mt-0.5`} />
                      </div>
                    </label>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Estes cookies são usados para exibir anúncios relevantes e medir a eficácia 
                    de nossas campanhas publicitárias em diferentes plataformas.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col sm:flex-row gap-3 p-6 border-t border-white/10">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 border border-white/20 hover:border-memora-primary text-muted-foreground hover:text-memora-primary font-heading font-bold py-3 px-6 rounded-2xl transition-colors duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleCustomSave}
                className="flex-1 bg-memora-primary hover:bg-memora-primary/90 text-white font-heading font-bold py-3 px-6 rounded-2xl transition-colors duration-200"
                data-attr="cookie-save-preferences"
              >
                Salvar Preferências
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CookieBanner;
