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
  // Em desenvolvimento, apontar para backend local se não houver VITE_API_URL
  // Em produção, NUNCA fazer fallback para localhost; usar a mesma origem (cadeia vazia)
  const apiBaseUrl = isDev
    ? (import.meta.env.VITE_API_URL || 'http://localhost:3003')
    : (import.meta.env.VITE_PROD_API_URL || '');

  if (!apiBaseUrl && !isDev) {
    console.warn("[API] VITE_PROD_API_URL não definida. Usando mesma origem para /api/");
  }

  return {
    isDevelopment: isDev,
    apiBaseUrl
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
  // Endpoints existentes
  GENERATE_PREVIEW: `${API_BASE_URL}/api/generate-preview`,
  CHECK_MUSIC_STATUS: `${API_BASE_URL}/api/check-music-status`,
  
  // Endpoints do sistema de identidade de convidado
  SONGS: '/api/songs',
  SONGS_DISCOVER: '/api/songs/discover',
  MIGRATE_GUEST_DATA: '/api/migrate-guest-data',
  
  // Endpoints de autenticação
  LOGIN: '/api/auth/login',
  SIGNUP: '/api/auth/signup',
  LOGOUT: '/api/auth/logout',
  
  // Endpoint do paywall
  PAYWALL: `${API_BASE_URL}/api/user`,
} as const;

// Funções de API específicas para o sistema de músicas
export const songsApi = {
  // Listar músicas (funciona com token ou guestId)
  list: async () => {
    // Determinar o identificador a ser enviado na query, conforme exigido pelo backend
    const { useAuthStore } = await import('../store/authStore');
    const { isLoggedIn, user } = useAuthStore.getState();
    let endpoint = API_ENDPOINTS.SONGS;
    if (isLoggedIn && user?.id) {
      endpoint += `?userId=${encodeURIComponent(user.id)}`;
    } else {
      const { getOrCreateGuestId } = await import('../utils/guest');
      const guestId = getOrCreateGuestId();
      endpoint += `?guestId=${encodeURIComponent(guestId)}`;
    }
    return apiRequest(endpoint);
  },
  
  // Descobrir músicas públicas aleatórias (para homepage)
  discover: (limit: number = 24) => apiRequest(`${API_ENDPOINTS.SONGS_DISCOVER}?limit=${limit}`),
  
  // Obter uma música específica
  get: (id: string) => apiRequest(`${API_ENDPOINTS.SONGS}/${id}`),

  // Obter dados públicos de uma música (para compartilhamento)
  getPublic: (id: string) => apiRequest(`${API_ENDPOINTS.SONGS}/${id}/public`),

  // Atualizar uma música (ex.: título/lyrics)
  update: (id: string, payload: { title?: string; lyrics?: string }) =>
    apiRequest(`${API_ENDPOINTS.SONGS}/${id}`, {
      method: 'PUT',
      body: payload,
    }),

  // Excluir uma música
  remove: (id: string) =>
    apiRequest(`${API_ENDPOINTS.SONGS}/${id}`, {
      method: 'DELETE',
    }),
};

// Funções de API para migração de dados
export const migrationApi = {
  // Migrar dados do convidado para usuário autenticado
  migrateGuestData: async (guestId: string) => {
    const { useAuthStore } = await import('../store/authStore');
    const { user } = useAuthStore.getState();
    const deviceId = localStorage.getItem('deviceId');
    return apiRequest(API_ENDPOINTS.MIGRATE_GUEST_DATA, {
      method: 'POST',
      body: {
        guestId,
        userId: user?.id,
        email: user?.email,
        name: user?.name,
        deviceId
      }
    });
  },
};

// Funções de API para autenticação
export const authApi = {
  login: (email: string, password: string) =>
    apiRequest(API_ENDPOINTS.LOGIN, {
      method: 'POST',
      body: { email, password }
    }),
    
  signup: (userData: { email: string; password: string; name: string }) =>
    apiRequest(API_ENDPOINTS.SIGNUP, {
      method: 'POST',
      body: userData
    }),
    
  logout: () =>
    apiRequest(API_ENDPOINTS.LOGOUT, {
      method: 'POST'
    }),
};

// Importações necessárias para o sistema de identidade
import { getOrCreateGuestId } from '../utils/guest';
import { ApiRequestOptions, ApiResponse, GUEST_ID_HEADER } from '../types/guest';

// Função helper para fazer requisições com tratamento de erro e identidade
export const apiRequest = async <T = unknown>(
  endpoint: string, 
  options: ApiRequestOptions = {}
): Promise<T> => {
  const { method = 'GET', body, headers = {} } = options;
  
  try {
    // Importação dinâmica do store para evitar problemas de dependência circular
    const { useAuthStore } = await import('../store/authStore');
    const { token, isLoggedIn } = useAuthStore.getState();
    
    // Configurar headers de autenticação e identidade
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers
    };
    
    // Sempre incluir o deviceId em todas as requisições
    const deviceId = localStorage.getItem('deviceId');
    if (deviceId) {
      requestHeaders['X-Device-ID'] = deviceId;
    }
    
    if (isLoggedIn && token) {
      // Usuário autenticado: usar token de autorização
      requestHeaders['Authorization'] = `Bearer ${token}`;
      console.debug('[API] Requisição com usuário autenticado');
    } else {
      // Usuário convidado: usar guestId
      const guestId = getOrCreateGuestId();
      requestHeaders[GUEST_ID_HEADER] = guestId;
      console.debug('[API] Requisição com guestId:', guestId);
    }
    
    // Construir URL completa
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      method,
      headers: requestHeaders,
      ...(body && { body: typeof body === 'string' ? body : JSON.stringify(body) })
    };
    
    console.debug(`[API] ${method} ${url}`);
    
    const response = await fetch(url, config);
    
    if (!response.ok) {
      let errorData;
      try {
        // Tenta ler o corpo da resposta como JSON
        const errorText = await response.text();
        console.error(`[API] Erro ${response.status}:`, errorText);
        
        // Tenta fazer parse do JSON se possível
        try {
          errorData = JSON.parse(errorText);
        } catch (parseError) {
          // Se não conseguir fazer parse, usa o texto como está
          errorData = { message: errorText };
        }
      } catch (readError) {
        // Se não conseguir ler a resposta
        console.error('[API] Erro ao ler resposta de erro:', readError);
        errorData = { message: `API Error: ${response.status} ${response.statusText}` };
      }
      
      // Criar erro customizado com informações do status HTTP
      const errorMessage = errorData.message || `API Error: ${response.status} ${response.statusText}`;
      const error = new Error(errorMessage);
      
      // Adicionar propriedade status para identificação específica de erros HTTP
      (error as Error & { status?: number; statusText?: string; data?: unknown }).status = response.status;
      (error as Error & { status?: number; statusText?: string; data?: unknown }).statusText = response.statusText;
      (error as Error & { status?: number; statusText?: string; data?: unknown }).data = errorData;
      
      throw error;
    }
    
    const data = await response.json();
    console.debug('[API] Resposta recebida:', data);
    
    return data;
  } catch (error) {
    console.error('[API] Erro na requisição:', error);
    throw error;
  }
};

// Função legacy mantida para compatibilidade
export const legacyApiRequest = async (url: string, options: RequestInit = {}) => {
  return apiRequest(url, {
    method: (options.method as 'GET' | 'POST' | 'PUT' | 'DELETE') || 'GET',
    body: options.body ? JSON.parse(options.body as string) : undefined,
    headers: options.headers as Record<string, string>
  });
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
