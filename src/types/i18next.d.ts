import 'react-i18next';

// Import translation resources for type inference
import type ptCommon from '../i18n/resources/pt/common.json';
import type ptAuth from '../i18n/resources/pt/auth.json';
import type ptForms from '../i18n/resources/pt/forms.json';
import type ptMarketing from '../i18n/resources/pt/marketing.json';
import type ptErrors from '../i18n/resources/pt/errors.json';

/**
 * TypeScript module augmentation for react-i18next
 * This provides type safety and autocompletion for translation keys
 */
declare module 'react-i18next' {
  interface CustomTypeOptions {
    // Define the default namespace
    defaultNS: 'common';
    
    // Define all available resources with their types
    resources: {
      common: typeof ptCommon;
      auth: typeof ptAuth;
      forms: typeof ptForms;
      marketing: typeof ptMarketing;
      errors: typeof ptErrors;
    };
    
    // Return type for t function
    returnNull: false;
    returnEmptyString: false;
    returnObjects: false;
  }
}

/**
 * Supported languages type
 */
export type SupportedLanguages = 'pt' | 'en';

/**
 * Available namespaces type
 */
export type Namespaces = 'common' | 'auth' | 'forms' | 'marketing' | 'errors';

/**
 * Translation key types for each namespace
 */
export type CommonKeys = keyof typeof ptCommon;
export type AuthKeys = keyof typeof ptAuth;
export type FormsKeys = keyof typeof ptForms;
export type MarketingKeys = keyof typeof ptMarketing;
export type ErrorsKeys = keyof typeof ptErrors;

/**
 * Nested key extraction utility type
 */
type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

/**
 * All possible translation keys with dot notation
 */
export type CommonTranslationKeys = NestedKeyOf<typeof ptCommon>;
export type AuthTranslationKeys = NestedKeyOf<typeof ptAuth>;
export type FormsTranslationKeys = NestedKeyOf<typeof ptForms>;
export type MarketingTranslationKeys = NestedKeyOf<typeof ptMarketing>;
export type ErrorsTranslationKeys = NestedKeyOf<typeof ptErrors>;

/**
 * Union of all translation keys
 */
export type AllTranslationKeys = 
  | CommonTranslationKeys
  | `auth:${AuthTranslationKeys}`
  | `forms:${FormsTranslationKeys}`
  | `marketing:${MarketingTranslationKeys}`
  | `errors:${ErrorsTranslationKeys}`;

/**
 * Translation function type with proper key validation
 */
export interface TranslationFunction {
  (key: CommonTranslationKeys, options?: any): string;
  (key: `auth:${AuthTranslationKeys}`, options?: any): string;
  (key: `forms:${FormsTranslationKeys}`, options?: any): string;
  (key: `marketing:${MarketingTranslationKeys}`, options?: any): string;
  (key: `errors:${ErrorsTranslationKeys}`, options?: any): string;
  (key: string, options?: any): string; // Fallback for dynamic keys
}

/**
 * Language change function type
 */
export type LanguageChangeFunction = (language: SupportedLanguages) => Promise<boolean>;

/**
 * Translation hook return type
 */
export interface UseTranslationReturn {
  t: TranslationFunction;
  translate: TranslationFunction;
  translateWithFallback: (key: string, fallback: string, options?: any) => string;
  translateFromNamespace: (ns: Namespaces, key: string, options?: any) => string;
  changeLanguage: LanguageChangeFunction;
  getCurrentLanguage: () => SupportedLanguages;
  isLanguageActive: (language: SupportedLanguages) => boolean;
  getAvailableLanguages: () => SupportedLanguages[];
  getLanguageDirection: () => 'ltr' | 'rtl';
  isReady: () => boolean;
  formatNumber: (number: number, options?: Intl.NumberFormatOptions) => string;
  formatDate: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatCurrency: (amount: number, currency?: string) => string;
  i18n: any; // i18next instance
}

/**
 * Language detector options type
 */
export interface LanguageDetectorOptions {
  order: string[];
  caches: string[];
  excludeCacheFor: string[];
  checkWhitelist: boolean;
}

/**
 * i18n configuration type
 */
export interface I18nConfig {
  fallbackLng: SupportedLanguages;
  supportedLngs: SupportedLanguages[];
  defaultNS: Namespaces;
  ns: Namespaces[];
  debug: boolean;
  detection: LanguageDetectorOptions;
}

/**
 * Translation interpolation options
 */
export interface TranslationOptions {
  [key: string]: any;
  count?: number;
  context?: string;
  defaultValue?: string;
  lng?: SupportedLanguages;
  ns?: Namespaces;
}

/**
 * Language info type
 */
export interface LanguageInfo {
  code: SupportedLanguages;
  name: string;
  nativeName: string;
  flag: string;
  direction: 'ltr' | 'rtl';
}

/**
 * Available languages with metadata
 */
export const AVAILABLE_LANGUAGES: LanguageInfo[] = [
  {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    flag: '🇧🇷',
    direction: 'ltr',
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    direction: 'ltr',
  },
];

/**
 * Default language
 */
export const DEFAULT_LANGUAGE: SupportedLanguages = 'pt';

/**
 * Default namespace
 */
export const DEFAULT_NAMESPACE: Namespaces = 'common';