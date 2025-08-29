/**
 * Configuração da API para diferentes ambientes
 * Detecta automaticamente se está em desenvolvimento ou produção
 */

// Função para detectar se está em ambiente de desenvolvimento
const isDevelopment = () => {
  return import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
};

// Função para obter a configuração da API
const getApiConfig = () => {
  const isDev = isDevelopment();
  const apiBaseUrl = isDev
    ? (import.meta.env.VITE_API_URL || 'http://localhost:3001')
    : import.meta.env.VITE_PROD_API_URL;

  if (!apiBaseUrl && !isDev) {
    console.error("ERRO: A URL da API não está definida nas variáveis de ambiente!");
    console.error("Por favor, defina VITE_PROD_API_URL nas variáveis de ambiente do Vercel.");
  }

  return {
    isDevelopment: isDev,
    apiBaseUrl: apiBaseUrl || 'http://localhost:3001' // fallback para desenvolvimento
  };
};

// Obter configuração da API
const apiConfig = getApiConfig();

// Função para obter a URL base da API (mantida para compatibilidade)
const getApiBaseUrl = (): string => {
  return apiConfig.apiBaseUrl;
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
    // Importação dinâmica para evitar problemas de SSR
    const { getOrCreateGuestId } = await import('../utils/guest');
    const { useAuthStore } = await import('../store/authStore');
    
    // Verifica se o usuário está logado
    const isLoggedIn = useAuthStore.getState().isLoggedIn;
    const token = useAuthStore.getState().token;
    
    // Prepara os headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };
    
    // Se o usuário estiver logado, adiciona o token de autorização
    if (isLoggedIn && token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      // Se não estiver logado, adiciona o guestId
      const guestId = getOrCreateGuestId();
      headers['X-Guest-ID'] = guestId;
    }
    
    const response = await fetch(url, {
      ...options,
      headers,
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
if (apiConfig.isDevelopment) {
  console.log('🔧 API Configuration:', {
    isDevelopment: apiConfig.isDevelopment,
    apiBaseUrl: apiConfig.apiBaseUrl,
    environment: import.meta.env.MODE,
    endpoints: API_ENDPOINTS,
  });
} else {
  // Em produção, apenas log se houver erro de configuração
  if (!apiConfig.apiBaseUrl) {
    console.error('❌ API Configuration Error: VITE_PROD_API_URL não definida!');
  }
}