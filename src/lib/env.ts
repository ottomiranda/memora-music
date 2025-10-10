type ImportMetaEnvLike = Record<string, string | boolean | undefined>;

const importMetaEnv: ImportMetaEnvLike | undefined =
  typeof import.meta !== 'undefined' && import.meta && import.meta.env
    ? (import.meta.env as ImportMetaEnvLike)
    : undefined;

const processEnv: Record<string, string | undefined> | undefined =
  typeof globalThis !== 'undefined' &&
  typeof (globalThis as { process?: { env?: Record<string, string | undefined> } }).process !== 'undefined'
    ? (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env || undefined
    : undefined;

export function getEnvVar(key: string): string | undefined {
  const metaValue = importMetaEnv?.[key];
  if (typeof metaValue === 'string') {
    return metaValue;
  }

  if (typeof metaValue === 'boolean') {
    return metaValue ? 'true' : 'false';
  }

  if (processEnv && typeof processEnv[key] === 'string') {
    return processEnv[key];
  }

  return undefined;
}

export function getEnvironment(): 'development' | 'test' | 'staging' | 'production' {
  const explicitEnv =
    getEnvVar('APP_ENV') ??
    getEnvVar('NODE_ENV') ??
    (typeof importMetaEnv?.MODE === 'string' ? (importMetaEnv.MODE as string) : undefined);

  switch (explicitEnv) {
    case 'production':
      return 'production';
    case 'test':
      return 'test';
    case 'staging':
      return 'staging';
    default:
      return 'development';
  }
}

export function isDevelopmentEnvironment(): boolean {
  if (typeof importMetaEnv?.DEV === 'boolean') {
    return importMetaEnv.DEV;
  }
  const nodeEnv = getEnvVar('NODE_ENV');
  return (nodeEnv ?? 'development') === 'development';
}

export function isProductionEnvironment(): boolean {
  if (typeof importMetaEnv?.PROD === 'boolean') {
    return importMetaEnv.PROD;
  }
  const nodeEnv = getEnvVar('NODE_ENV');
  return nodeEnv === 'production';
}

export function resolveApiBaseUrl(): string {
  const envUrl =
    getEnvVar('VITE_API_URL') ??
    getEnvVar('NEXT_PUBLIC_API_URL') ??
    getEnvVar('PUBLIC_API_URL');

  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin.replace(/\/+$/, '')}/api`;
  }

  return 'http://localhost:3000/api';
}
