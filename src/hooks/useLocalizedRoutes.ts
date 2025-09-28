import { useMemo, useCallback } from 'react';
import { useTranslation } from '@/i18n/hooks/useTranslation';
import type { RouteKey } from '@/routes/paths';
import { buildLocalizedPath, getLocalizedPaths } from '@/routes/paths';
import type { SupportedLanguages } from '@/i18n';

type RouteParams = Record<string, string | undefined>;

export const useLocalizedRoutes = () => {
  const { getCurrentLanguage } = useTranslation('common');
  const language = getCurrentLanguage();

  const localizedPaths = useMemo(() => getLocalizedPaths(language), [language]);

  const buildPath = useCallback(
    (key: RouteKey, params?: RouteParams, langOverride?: SupportedLanguages) => {
      const targetLanguage = langOverride || language;
      return buildLocalizedPath(key, targetLanguage, params);
    },
    [language]
  );

  return {
    language,
    localizedPaths,
    buildPath,
  };
};

export default useLocalizedRoutes;
