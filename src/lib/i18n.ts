import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { AppError } from '@/types/app';
import { logger } from '@/lib/logger';

interface I18nConfig {
  defaultLocale: string;
  locales: string[];
  loadPath: string;
}

export async function initializeI18n(config: I18nConfig): Promise<void> {
  try {
    await i18n
      .use(LanguageDetector)
      .use(initReactI18next)
      .init({
        defaultNS: 'common',
        fallbackLng: config.defaultLocale,
        supportedLngs: config.locales,
        ns: [
          'common',
          'auth',
          'forms',
          'marketing',
          'errors',
          'accessibility'
        ],
        backend: {
          loadPath: config.loadPath
        },
        detection: {
          order: ['localStorage', 'navigator'],
          caches: ['localStorage']
        },
        interpolation: {
          escapeValue: false
        }
      });

    logger.info({
      msg: 'I18n initialized successfully',
      defaultLocale: config.defaultLocale,
      availableLocales: config.locales
    });
  } catch (error) {
    const appError: AppError = {
      code: 'I18N_INITIALIZATION_ERROR',
      message: error instanceof Error ? error.message : 'Failed to initialize i18n',
      stack: error instanceof Error ? error.stack : undefined
    };

    logger.error({
      msg: 'Failed to initialize i18n',
      error: appError
    });

    throw appError;
  }
}

export type { I18nConfig };
export { i18n };
