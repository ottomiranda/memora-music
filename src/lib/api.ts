import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosError } from 'axios';
import { logger } from '@/lib/logger';
import type { AppError, ApiResponse } from '@/types/app';

let api: AxiosInstance | null = null;
const DEFAULT_TIMEOUT = 30000;

export interface ApiInterceptorsConfig {
  baseUrl?: string;
  version?: string;
  timeout?: number;
}

// Tipos de requisição
export interface ApiRequestConfig extends AxiosRequestConfig {
  skipAuth?: boolean;
  skipErrorHandling?: boolean;
  traceId?: string;
}

// Tipos de resposta
export interface ApiErrorDetails {
  config?: AxiosRequestConfig;
  status?: number;
  data?: unknown;
}

// Função para criar erro da API
function createApiError(
  code: string,
  message: string,
  details?: ApiErrorDetails
): AppError {
  return {
    code,
    message,
    details
  };
}

// Função para gerar ID de trace
function generateTraceId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Função para obter token de autenticação
function getAuthToken(): string | null {
  try {
    const authStore = window.useAuthStore?.getState();
    return authStore?.token || null;
  } catch (error) {
    logger.warn('Failed to get auth token:', error);
    return null;
  }
}

function normalizeBaseUrl(baseUrl?: string, version?: string): string | undefined {
  const normalizedBase = (baseUrl && baseUrl.trim().length > 0 ? baseUrl : '/api').replace(/\/+$/, '');
  const normalizedVersion = version ? version.replace(/^\/+|\/+$/g, '') : '';

  if (!normalizedBase) {
    return normalizedVersion ? `/${normalizedVersion}` : undefined;
  }

  return normalizedVersion ? `${normalizedBase}/${normalizedVersion}` : normalizedBase;
}

// Função para configurar interceptadores da API
export function setupApiInterceptors(options: ApiInterceptorsConfig = {}): void {
  if (api) {
    logger.warn('API interceptors already setup');
    return;
  }

  const baseURL = normalizeBaseUrl(options.baseUrl, options.version);

  api = axios.create({
    baseURL,
    timeout: options.timeout ?? DEFAULT_TIMEOUT,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Interceptador de requisição
  api.interceptors.request.use(
    (config) => {
      const token = getAuthToken();
      const traceId = generateTraceId();

      // Adiciona headers de autenticação e rastreamento
      config.headers = {
        ...config.headers,
        'X-Trace-Id': traceId
      };

      if (token && !config.skipAuth) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      logger.debug({
        msg: 'API request',
        method: config.method,
        url: config.url,
        traceId
      });

      return config;
    },
    (error: Error) => {
      const apiError = createApiError(
        'API_REQUEST_ERROR',
        error.message
      );

      logger.error({
        msg: 'API request error',
        error: apiError
      });

      return Promise.reject(apiError);
    }
  );

  // Interceptador de resposta
  api.interceptors.response.use(
    (response) => {
      logger.debug({
        msg: 'API response',
        status: response.status,
        url: response.config.url
      });

      return response;
    },
    (error: AxiosError) => {
      const apiError = createApiError(
        'API_RESPONSE_ERROR',
        error.message,
        {
          config: error.config,
          status: error.response?.status,
          data: error.response?.data
        }
      );

      logger.error({
        msg: 'API response error',
        error: apiError
      });

      // Trata erros de autenticação
      if (error.response?.status === 401 && !error.config?.skipAuth) {
        window.location.href = '/login';
      }

      return Promise.reject(apiError);
    }
  );
}

// Função para obter instância da API
export function getApi(): AxiosInstance {
  if (!api) {
    throw new Error('API not initialized. Call setupApiInterceptors first.');
  }
  return api;
}

// Funções helper tipadas para requisições
export async function get<T>(
  url: string,
  config?: ApiRequestConfig
): Promise<ApiResponse<T>> {
  const response = await getApi().get<ApiResponse<T>>(url, config);
  return response.data;
}

export async function post<T>(
  url: string,
  data?: unknown,
  config?: ApiRequestConfig
): Promise<ApiResponse<T>> {
  const response = await getApi().post<ApiResponse<T>>(url, data, config);
  return response.data;
}

export async function put<T>(
  url: string,
  data?: unknown,
  config?: ApiRequestConfig
): Promise<ApiResponse<T>> {
  const response = await getApi().put<ApiResponse<T>>(url, data, config);
  return response.data;
}

export async function patch<T>(
  url: string,
  data?: unknown,
  config?: ApiRequestConfig
): Promise<ApiResponse<T>> {
  const response = await getApi().patch<ApiResponse<T>>(url, data, config);
  return response.data;
}

export async function del<T>(
  url: string,
  config?: ApiRequestConfig
): Promise<ApiResponse<T>> {
  const response = await getApi().delete<ApiResponse<T>>(url, config);
  return response.data;
}
