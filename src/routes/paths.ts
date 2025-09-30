import type { SupportedLanguages } from '@/i18n';

export type RouteKey =
  | 'home'
  | 'create'
  | 'myMusic'
  | 'publicMusic'
  | 'authCallback'
  | 'termsOfUse'
  | 'privacyPolicy';

type RouteParams = Record<string, string | undefined>;

const ROUTE_TEMPLATES: Record<RouteKey, Record<SupportedLanguages, string>> = {
  home: {
    pt: '/',
    en: '/',
  },
  create: {
    pt: '/criar',
    en: '/create',
  },
  myMusic: {
    pt: '/minhas-musicas',
    en: '/my-music',
  },
  publicMusic: {
    pt: '/musica/:id',
    en: '/song/:id',
  },
  authCallback: {
    pt: '/auth/callback',
    en: '/auth/callback',
  },
  termsOfUse: {
    pt: '/termos-de-uso',
    en: '/terms-of-use',
  },
  privacyPolicy: {
    pt: '/politica-de-privacidade',
    en: '/privacy-policy',
  },

};

/**
 * Build a localized path for given route and language replacing dynamic segments.
 */
export const buildLocalizedPath = (
  key: RouteKey,
  language: SupportedLanguages,
  params?: RouteParams
): string => {
  // Fallback to 'pt' if language is undefined or invalid
  const validLanguage = language || 'pt';
  
  // Check if the route key exists in ROUTE_TEMPLATES
  if (!ROUTE_TEMPLATES[key]) {
    console.warn(`Route key "${key}" not found in ROUTE_TEMPLATES`);
    return '/';
  }
  
  const routeTemplates = ROUTE_TEMPLATES[key];
  const template = routeTemplates[validLanguage] || routeTemplates['pt'] || '/';
  
  if (!params) return template;

  return template.replace(/:([A-Za-z0-9_]+)/g, (match, paramKey) => {
    const value = params[paramKey];
    if (!value) {
      console.warn(`Missing param "${paramKey}" for route "${key}" when building localized path.`);
      return match;
    }
    return encodeURIComponent(value);
  });
};

/**
 * Return the localized path mapping for all routes in a given language.
 */
export const getLocalizedPaths = (language: SupportedLanguages): Record<RouteKey, string> => {
  // Fallback to 'pt' if language is undefined or invalid
  const validLanguage = language || 'pt';
  
  return Object.entries(ROUTE_TEMPLATES).reduce<Record<RouteKey, string>>((acc, [key, value]) => {
    const template = value[validLanguage];
    if (template) {
      acc[key as RouteKey] = template;
    } else {
      // Fallback to 'pt' if the language doesn't exist in the template
      acc[key as RouteKey] = value['pt'];
    }
    return acc;
  }, {} as Record<RouteKey, string>);
};

/**
 * List of legacy paths (all paths from other languages) that should redirect to
 * the current language equivalent.
 */
export const getLegacyPaths = (
  currentLanguage: SupportedLanguages
): Array<{ key: RouteKey; path: string; language: SupportedLanguages }> => {
  const otherLanguages = Object.keys(ROUTE_TEMPLATES.home) as SupportedLanguages[];
  return Object.entries(ROUTE_TEMPLATES).flatMap(([key, translations]) => {
    return otherLanguages
      .filter((language) => language !== currentLanguage)
      .map((language) => ({
        key: key as RouteKey,
        path: translations[language],
        language,
      }))
      .filter(({ path, key: routeKey }) => path !== ROUTE_TEMPLATES[routeKey][currentLanguage]);
  });
};

/**
 * Tries to find a matching route key for a given pathname across all languages.
 * Returns the key and extracted params when possible.
 */
export const resolveRouteByPath = (
  pathname: string
): { key: RouteKey; params: Record<string, string> } | null => {
  const sanitizedPath = pathname.replace(/\/$/, '') || '/';

  for (const [key, translations] of Object.entries(ROUTE_TEMPLATES) as Array<[
    RouteKey,
    Record<SupportedLanguages, string>
  ]>) {
    for (const template of Object.values(translations)) {
      const { regex, paramNames } = templateToRegex(template);
      const match = sanitizedPath.match(regex);
      if (match) {
        const params: Record<string, string> = {};
        paramNames.forEach((paramName, index) => {
          params[paramName] = decodeURIComponent(match[index + 1]);
        });
        return { key, params };
      }
    }
  }

  return null;
};

const templateRegexCache = new Map<string, { regex: RegExp; paramNames: string[] }>();

const templateToRegex = (template: string) => {
  if (templateRegexCache.has(template)) {
    return templateRegexCache.get(template)!;
  }

  const paramNames: string[] = [];
  const pattern = template
    .replace(/\//g, '\\/')
    .replace(/:([A-Za-z0-9_]+)/g, (_match, paramName) => {
      paramNames.push(paramName);
      return '([^/]+)';
    });

  const regex = new RegExp(`^${pattern}$`);
  const result = { regex, paramNames };
  templateRegexCache.set(template, result);
  return result;
};

export { ROUTE_TEMPLATES };
