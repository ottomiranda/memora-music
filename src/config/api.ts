/**
 * Configuração da API para diferentes ambientes
 * Detecta automaticamente se está em desenvolvimento ou produção
 */

// Função para detectar se está em ambiente de desenvolvimento
const isDevelopment = () => {
  return import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
};

// Função para obter a URL base da API
const getApiBaseUrl = (): string => {
  // Em desenvolvimento, usa a variável de ambiente ou fallback para localhost:3001
  if (isDevelopment()) {
    return import.meta.env.VITE_API_URL || 'http://localhost:3001';
  }
  
  // Em produção, usa a mesma origem do frontend (Vercel)
  // Isso funciona porque o Vercel serve tanto o frontend quanto as API routes
  return window.location.origin;
};

// URL base da API
export const API_BASE_URL = getApiBaseUrl();

// Endpoints da API
export const API_ENDPOINTS = {
  GENERATE_PREVIEW: `${API_BASE_URL}/api/generate-preview`,
  CHECK_MUSIC_STATUS: `${API_BASE_URL}/api/check-music-status`,
} as const;

// Função helper para fazer requisições com tratamento de erro
export const apiRequest = async (url: string, options: RequestInit = {}) => {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

// Log da configuração atual (apenas em desenvolvimento)
if (isDevelopment()) {
  console.log('🔧 API Configuration:', {
    isDevelopment: isDevelopment(),
    apiBaseUrl: API_BASE_URL,
    endpoints: API_ENDPOINTS,
  });
}