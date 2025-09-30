import { useTranslation } from '@/i18n/hooks/useTranslation';
import { buildLocalizedPath, getLocalizedPaths } from '@/routes/paths';
import type { RouteKey } from '@/routes/paths';

export const useLocalizedRoutes = () => {
  const { language, isReady } = useTranslation();

  // Return safe defaults if i18n is not ready
  if (!isReady || !language) {
    const fallbackPaths = getLocalizedPaths('pt');
    const fallbackBuildPath = (key: RouteKey, params?: Record<string, string>) => {
      return buildLocalizedPath(key, 'pt', params);
    };
    
    return {
      paths: fallbackPaths,
      buildPath: fallbackBuildPath,
    };
  }

  const paths = getLocalizedPaths(language);

  const buildPath = (key: RouteKey, params?: Record<string, string>) => {
    return buildLocalizedPath(key, language, params);
  };

  return {
    paths,
    buildPath,
  };
};

export default useLocalizedRoutes;
