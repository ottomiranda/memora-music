import { useTranslation as useI18nTranslation } from 'react-i18next';
/**
 * Custom hook for translations with enhanced TypeScript support
 * Provides a more convenient interface for using react-i18next
 */
export const useTranslation = (namespace) => {
    const { t, i18n } = useI18nTranslation(namespace);
    /**
     * Translation function with namespace support
     * @param key - Translation key (can include namespace with ':')
     * @param options - Translation options (interpolation, etc.)
     */
    const translate = (key, options) => {
        return t(key, options);
    };
    /**
     * Change the current language
     * @param language - Target language
     */
    const changeLanguage = async (language) => {
        try {
            await i18n.changeLanguage(language);
            return true;
        }
        catch (error) {
            console.error('Failed to change language:', error);
            return false;
        }
    };
    /**
     * Get the current language
     */
    const getCurrentLanguage = () => {
        return i18n.language;
    };
    /**
     * Check if a language is currently active
     * @param language - Language to check
     */
    const isLanguageActive = (language) => {
        return i18n.language === language;
    };
    /**
     * Get available languages
     */
    const getAvailableLanguages = () => {
        return ['pt', 'en'];
    };
    /**
     * Check if translations are ready
     */
    const isReady = () => {
        return i18n.isInitialized;
    };
    /**
     * Get translation with fallback
     * @param key - Translation key
     * @param fallback - Fallback text if translation is missing
     * @param options - Translation options
     */
    const translateWithFallback = (key, fallback, options) => {
        const translation = t(key, options);
        return translation === key ? fallback : translation;
    };
    /**
     * Translate with namespace prefix
     * @param ns - Namespace
     * @param key - Translation key
     * @param options - Translation options
     */
    const translateFromNamespace = (ns, key, options) => {
        return t(`${ns}:${key}`, options);
    };
    /**
     * Get language direction (for RTL support in the future)
     */
    const getLanguageDirection = () => {
        // Currently all supported languages are LTR
        // This can be extended when RTL languages are added
        return 'ltr';
    };
    /**
     * Format number according to current locale
     * @param number - Number to format
     * @param options - Intl.NumberFormat options
     */
    const formatNumber = (number, options) => {
        const locale = getCurrentLanguage() === 'pt' ? 'pt-BR' : 'en-US';
        return new Intl.NumberFormat(locale, options).format(number);
    };
    /**
     * Format date according to current locale
     * @param date - Date to format
     * @param options - Intl.DateTimeFormat options
     */
    const formatDate = (date, options) => {
        const locale = getCurrentLanguage() === 'pt' ? 'pt-BR' : 'en-US';
        return new Intl.DateTimeFormat(locale, options).format(new Date(date));
    };
    /**
     * Format currency according to current locale
     * @param amount - Amount to format
     * @param currency - Currency code (default: BRL for PT, USD for EN)
     */
    const formatCurrency = (amount, currency) => {
        const currentLang = getCurrentLanguage();
        const locale = currentLang === 'pt' ? 'pt-BR' : 'en-US';
        const defaultCurrency = currentLang === 'pt' ? 'BRL' : 'USD';
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency || defaultCurrency,
        }).format(amount);
    };
    return {
        // Core translation functions
        t: translate,
        translate,
        translateWithFallback,
        translateFromNamespace,
        // Language management
        changeLanguage,
        getCurrentLanguage,
        isLanguageActive,
        getAvailableLanguages,
        getLanguageDirection,
        // Status
        isReady,
        // Formatting utilities
        formatNumber,
        formatDate,
        formatCurrency,
        // Direct access to i18n instance (for advanced usage)
        i18n,
    };
};
/**
 * Hook specifically for common translations
 */
export const useCommonTranslation = () => {
    return useTranslation('common');
};
/**
 * Hook specifically for auth translations
 */
export const useAuthTranslation = () => {
    return useTranslation('auth');
};
/**
 * Hook specifically for form translations
 */
export const useFormTranslation = () => {
    return useTranslation('forms');
};
/**
 * Hook specifically for marketing translations
 */
export const useMarketingTranslation = () => {
    return useTranslation('marketing');
};
/**
 * Hook specifically for error translations
 */
export const useErrorTranslation = () => {
    return useTranslation('errors');
};
// Export the main hook as default
export default useTranslation;
//# sourceMappingURL=useTranslation.js.map