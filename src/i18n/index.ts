import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import Portuguese translations
import ptCommon from './resources/pt/common.json';
import ptAuth from './resources/pt/auth.json';
import ptAuthStore from './resources/pt/authStore.json';
import ptForms from './resources/pt/forms.json';
import ptMarketing from './resources/pt/marketing.json';
import ptErrors from './resources/pt/errors.json';
import ptCriar from './resources/pt/criar.json';
import ptFinalCta from './resources/pt/finalCta.json';
import ptHero from './resources/pt/hero.json';
import ptHowItWorks from './resources/pt/howItWorks.json';
import ptMusicStore from './resources/pt/musicStore.json';
import ptPayment from './resources/pt/payment.json';
import ptPlanSection from './resources/pt/planSection.json';
import ptValidation from './resources/pt/validation.json';
import ptValidations from './resources/pt/validations.json';
import ptUseAutoMigration from './resources/pt/useAutoMigration.json';
import ptMinhasMusicas from './resources/pt/minhasMusicas.json';
import authCallbackPt from './resources/pt/authCallback.json';
import musicaPublicaPt from './resources/pt/musicaPublica.json';
import ptLegal from './resources/pt/legal.json';
import ptAccessibility from './resources/pt/accessibility.json';

// Import English translations
import enCommon from './resources/en/common.json';
import enAuth from './resources/en/auth.json';
import enAuthStore from './resources/en/authStore.json';
import enForms from './resources/en/forms.json';
import enMarketing from './resources/en/marketing.json';
import enErrors from './resources/en/errors.json';
import enCriar from './resources/en/criar.json';
import enFinalCta from './resources/en/finalCta.json';
import enHero from './resources/en/hero.json';
import enHowItWorks from './resources/en/howItWorks.json';
import enMusicStore from './resources/en/musicStore.json';
import enPayment from './resources/en/payment.json';
import enPlanSection from './resources/en/planSection.json';
import enValidation from './resources/en/validation.json';
import enValidations from './resources/en/validations.json';
import enUseAutoMigration from './resources/en/useAutoMigration.json';
import enMinhasMusicas from './resources/en/minhasMusicas.json';
import authCallbackEn from './resources/en/authCallback.json';
import musicaPublicaEn from './resources/en/musicaPublica.json';
import enLegal from './resources/en/legal.json';
import enAccessibility from './resources/en/accessibility.json';

// Define resources structure
const resources = {
  pt: {
    common: ptCommon,
    auth: ptAuth,
    authStore: ptAuthStore,
    forms: ptForms,
    marketing: ptMarketing,
    errors: ptErrors,
    criar: ptCriar,
    finalCta: ptFinalCta,
    hero: ptHero,
    howItWorks: ptHowItWorks,
    musicStore: ptMusicStore,
    payment: ptPayment,
    planSection: ptPlanSection,
    validation: ptValidation,
    validations: ptValidations,
    useAutoMigration: ptUseAutoMigration,
    minhasMusicas: ptMinhasMusicas,
    authCallback: authCallbackPt,
    musicaPublica: musicaPublicaPt,
    legal: ptLegal,
    accessibility: ptAccessibility,
  },
  en: {
    common: enCommon,
    auth: enAuth,
    authStore: enAuthStore,
    forms: enForms,
    marketing: enMarketing,
    errors: enErrors,
    criar: enCriar,
    finalCta: enFinalCta,
    hero: enHero,
    howItWorks: enHowItWorks,
    musicStore: enMusicStore,
    payment: enPayment,
    planSection: enPlanSection,
    validation: enValidation,
    validations: enValidations,
    useAutoMigration: enUseAutoMigration,
    minhasMusicas: enMinhasMusicas,
    authCallback: authCallbackEn,
    musicaPublica: musicaPublicaEn,
    legal: enLegal,
    accessibility: enAccessibility,
  },
};

// Language detector configuration
const detectionOptions = {
  // Order of language detection methods
  order: ['localStorage', 'navigator', 'htmlTag'],
  
  // Cache user language
  caches: ['localStorage'],
  
  // Exclude certain detection methods
  excludeCacheFor: ['cimode'],
  
  // Check for supported languages
  checkWhitelist: true,
  
  // Language mapping to normalize browser languages
  lookupLocalStorage: 'i18nextLng',
  lookupSessionStorage: 'i18nextLng',
};

// Language normalization function
const normalizeLanguage = (lng: string): SupportedLanguages => {
  // Only return Portuguese for Portuguese languages
  if (lng.startsWith('pt')) return 'pt';
  
  // All other languages default to English
  return 'en';
};

// Initialize i18next
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // Resources
    resources,
    
    // Default language
    fallbackLng: 'en',
    
    // Supported languages
    supportedLngs: ['pt', 'en'],
    
    // Language detection
    detection: detectionOptions,
    
    // Namespace configuration
    defaultNS: 'common',
    ns: [
      'common', 'auth', 'authStore', 'forms', 'marketing', 'errors', 
      'criar', 'finalCta', 'hero', 'howItWorks', 'musicStore', 
      'payment', 'planSection', 'validation', 'validations', 'useAutoMigration', 'minhasMusicas',
      'authCallback', 'musicaPublica', 'legal', 'accessibility'
    ],
    
    // Interpolation options
    interpolation: {
      escapeValue: false, // React already escapes values
      formatSeparator: ',',
    },
    
    // React options
    react: {
      useSuspense: false, // Disable suspense for better error handling
      bindI18n: 'languageChanged',
      bindI18nStore: '',
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'em'],
    },
    
    // Debug mode (disable in production)
    debug: import.meta.env.DEV,
    
    // Key separator
    keySeparator: '.',
    
    // Namespace separator
    nsSeparator: ':',
    
    // Return objects for nested keys
    returnObjects: false,
    
    // Return null for missing keys
    returnNull: false,
    
    // Return empty string for missing keys
    returnEmptyString: false,
    
    // Postprocessing
    postProcess: false,
    
    // Load strategy
    load: 'languageOnly',
    
    // Preload languages
    preload: ['pt', 'en'],
    
    // Clean code
    cleanCode: true,
    
    // Language mapping for normalization
    lng: undefined, // Let the detector handle initial language
    
    // Normalize detected languages
    initImmediate: false,
  })
  .then(() => {
    // Normalize the detected language after initialization
    const currentLang = i18n.language;
    const normalizedLang = normalizeLanguage(currentLang);
    
    if (currentLang !== normalizedLang) {
      i18n.changeLanguage(normalizedLang);
    }
  });

// Export configured i18n instance
export default i18n;

// Expose i18n to window for debugging and testing
if (typeof window !== 'undefined') {
  (window as any).i18n = i18n;
}

// Export types for better TypeScript support
export type SupportedLanguages = 'pt' | 'en';
export type Namespaces = 
  | 'common' | 'auth' | 'authStore' | 'forms' | 'marketing' | 'errors' 
  | 'criar' | 'finalCta' | 'hero' | 'howItWorks' | 'musicStore' 
  | 'payment' | 'planSection' | 'validation' | 'validations' | 'useAutoMigration' | 'minhasMusicas'
  | 'authCallback' | 'musicaPublica' | 'legal';

// Helper function to change language
export const changeLanguage = (lng: SupportedLanguages) => {
  return i18n.changeLanguage(lng);
};

// Helper function to get current language
export const getCurrentLanguage = (): SupportedLanguages => {
  return i18n.language as SupportedLanguages;
};

// Helper function to get available languages
export const getAvailableLanguages = (): SupportedLanguages[] => {
  return ['pt', 'en'];
};

// Helper function to check if language is supported
export const isLanguageSupported = (lng: string): lng is SupportedLanguages => {
  return ['pt', 'en'].includes(lng);
};