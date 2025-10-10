import { z } from 'zod';

// Configuração global da aplicação
export const AppConfigSchema = z.object({
  name: z.string(),
  version: z.string(),
  environment: z.enum(['development', 'test', 'staging', 'production']),
  debug: z.boolean(),
  api: z.object({
    baseUrl: z.string().url(),
    version: z.string(),
    timeout: z.number().int().positive()
  }),
  features: z.object({
    auth: z.boolean(),
    analytics: z.boolean(),
    sentry: z.boolean(),
    openTelemetry: z.boolean()
  }),
  i18n: z.object({
    defaultLocale: z.string(),
    locales: z.array(z.string()),
    loadPath: z.string()
  }),
  seo: z.object({
    titleTemplate: z.string(),
    defaultTitle: z.string(),
    description: z.string()
  })
});

// Estado global da aplicação
export const AppStateSchema = z.object({
  initialized: z.boolean(),
  loading: z.boolean(),
  error: z.string().nullable(),
  user: z.object({
    authenticated: z.boolean(),
    id: z.string().optional(),
    role: z.string().optional()
  }),
  theme: z.enum(['light', 'dark', 'system']),
  locale: z.string(),
  notifications: z.array(z.object({
    id: z.string(),
    type: z.enum(['info', 'success', 'warning', 'error']),
    message: z.string(),
    duration: z.number().optional()
  }))
});

// Tipos inferidos dos schemas
export type AppConfig = z.infer<typeof AppConfigSchema>;
export type AppState = z.infer<typeof AppStateSchema>;

// Tipos de erro da aplicação
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  stack?: string;
}

// Tipos de resposta da API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: AppError;
  meta?: {
    page?: number;
    perPage?: number;
    total?: number;
    totalPages?: number;
  };
}

// Tipos de evento da aplicação
export interface AppEvent<T = unknown> {
  type: string;
  payload: T;
  timestamp: number;
  source?: string;
}

// Tipos de métricas da aplicação
export interface AppMetrics {
  performance: {
    ttfb: number;
    fcp: number;
    lcp: number;
    cls: number;
    fid: number;
  };
  errors: {
    count: number;
    lastError?: AppError;
  };
  api: {
    requests: number;
    failures: number;
    averageResponseTime: number;
  };
}

// Tipos de permissões
export type Permission = 
  | 'read:users'
  | 'write:users'
  | 'read:songs'
  | 'write:songs'
  | 'read:artists'
  | 'write:artists'
  | 'admin';

// Tipos de roles
export type Role = 
  | 'user'
  | 'artist'
  | 'admin'
  | 'superadmin';

// Mapa de permissões por role
export const RolePermissions: Record<Role, Permission[]> = {
  user: ['read:songs', 'read:artists'],
  artist: ['read:songs', 'write:songs', 'read:artists'],
  admin: ['read:users', 'write:users', 'read:songs', 'write:songs', 'read:artists', 'write:artists'],
  superadmin: ['read:users', 'write:users', 'read:songs', 'write:songs', 'read:artists', 'write:artists', 'admin']
};

// Extensão da interface Window para tipos globais
declare global {
  interface Window {
    __APP_CONFIG__?: AppConfig;
    __APP_STATE__?: AppState;
    __APP_VERSION__?: string;
  }
}