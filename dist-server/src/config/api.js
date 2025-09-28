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
const getApiBaseUrl = () => {
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
    // Endpoints da Suno API
    SUNO_GENERATE: 'https://api.sunoapi.org/api/generate',
    SUNO_GET_TASK: 'https://api.sunoapi.org/api/get',
};
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
        }
        else {
            const { getOrCreateGuestId } = await import('../utils/guest');
            const guestId = getOrCreateGuestId();
            endpoint += `?guestId=${encodeURIComponent(guestId)}`;
        }
        return apiRequest(endpoint);
    },
    // Descobrir músicas públicas aleatórias (para homepage)
    discover: (limit = 24) => apiRequest(`${API_ENDPOINTS.SONGS_DISCOVER}?limit=${limit}`),
    // Obter uma música específica
    get: (id) => apiRequest(`${API_ENDPOINTS.SONGS}/${id}`),
    // Obter dados públicos de uma música (para compartilhamento)
    getPublic: (id) => apiRequest(`${API_ENDPOINTS.SONGS}/${id}/public`),
    // Atualizar uma música (ex.: título/lyrics)
    update: (id, payload) => apiRequest(`${API_ENDPOINTS.SONGS}/${id}`, {
        method: 'PUT',
        body: payload,
    }),
    // Excluir uma música
    remove: (id) => apiRequest(`${API_ENDPOINTS.SONGS}/${id}`, {
        method: 'DELETE',
    }),
};
// Funções de API para migração de dados
export const migrationApi = {
    // Migrar dados do convidado para usuário autenticado
    migrateGuestData: async (guestId) => {
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
    login: (email, password) => apiRequest(API_ENDPOINTS.LOGIN, {
        method: 'POST',
        body: { email, password }
    }),
    signup: (userData) => apiRequest(API_ENDPOINTS.SIGNUP, {
        method: 'POST',
        body: userData
    }),
    logout: () => apiRequest(API_ENDPOINTS.LOGOUT, {
        method: 'POST'
    }),
};
// Configuração da Suno API
const SUNO_API_KEY = import.meta.env.VITE_SUNO_API_KEY;
// Função helper para requisições da Suno API
const sunoApiRequest = async (endpoint, options = {}) => {
    const { method = 'GET', body, headers = {} } = options;
    if (!SUNO_API_KEY) {
        console.warn('[SUNO API] API Key não configurada');
        return {
            success: false,
            error: 'API Key da Suno não configurada'
        };
    }
    try {
        const requestHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUNO_API_KEY}`,
            ...headers
        };
        const config = {
            method,
            headers: requestHeaders,
            ...(body && { body: typeof body === 'string' ? body : JSON.stringify(body) })
        };
        console.debug(`[SUNO API] ${method} ${endpoint}`);
        const response = await fetch(endpoint, config);
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[SUNO API] Erro ${response.status}:`, errorText);
            return {
                success: false,
                error: `Erro da Suno API: ${response.status} ${response.statusText}`,
                message: errorText
            };
        }
        const data = await response.json();
        console.debug('[SUNO API] Resposta recebida:', data);
        return {
            success: true,
            ...data
        };
    }
    catch (error) {
        console.error('[SUNO API] Erro na requisição:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Erro desconhecido'
        };
    }
};
// Funções de API da Suno
export const sunoApi = {
    // Gerar músicas usando a Suno API
    generate: async (prompt, options = {}) => {
        const requestBody = {
            customMode: false, // Modo simples por padrão
            instrumental: false,
            model: 'V4',
            callBackUrl: `${window.location.origin}/api/suno-callback`, // Callback fictício
            prompt,
            ...options
        };
        return sunoApiRequest(API_ENDPOINTS.SUNO_GENERATE, {
            method: 'POST',
            body: requestBody
        });
    },
    // Obter status de uma tarefa de geração
    getTask: async (taskId) => {
        return sunoApiRequest(`${API_ENDPOINTS.SUNO_GET_TASK}?ids=${taskId}`);
    },
    // Obter detalhes de uma música gerada usando o endpoint correto
    getMusicDetails: async (taskId) => {
        try {
            const base = API_BASE_URL || '';
            const url = `${base}/api/suno/music/${taskId}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[Suno API] Erro ${response.status}:`, errorText);
                return {
                    success: false,
                    error: `API Error: ${response.status} ${response.statusText}`,
                    message: errorText
                };
            }
            const data = await response.json();
            if (data?.success && data?.data) {
                return {
                    success: true,
                    data: data.data
                };
            }
            return {
                success: false,
                error: data?.error || 'Resposta inválida da API Suno',
                message: data?.message
            };
        }
        catch (error) {
            console.error('[Suno API] Erro ao obter detalhes da música:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Erro desconhecido',
                message: 'Falha ao conectar com a API da Suno'
            };
        }
    },
    // Converter música da Suno para formato da aplicação
    convertToAppSong: (sunoSong) => {
        return {
            id: `suno_${sunoSong.id}`,
            title: sunoSong.title || 'Música Suno',
            audioUrl: sunoSong.audio_url,
            audioUrlOption1: sunoSong.audio_url,
            audioUrlOption2: undefined,
            coverUrl: sunoSong.image_url || 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=music%20album%20cover%20abstract%20colorful&image_size=square',
            duration: sunoSong.duration,
            genre: sunoSong.tags || 'Gerada por IA',
            artist: 'Suno AI',
            createdAt: sunoSong.created_at || new Date().toISOString(),
            source: 'suno'
        };
    },
    // Buscar músicas de exemplo/demo da Suno (simulado)
    getExampleSongs: async () => {
        // Como a Suno API requer geração, vamos simular algumas músicas de exemplo
        // Em uma implementação real, você poderia ter músicas pré-geradas ou usar um cache
        const exampleSongs = [
            {
                id: 'suno_example_1',
                title: 'Melodia Relaxante',
                audioUrl: 'https://file-examples.com/storage/fe68c8777d66f45d7a9f0c5/2017/11/file_example_MP3_700KB.mp3',
                audioUrlOption1: 'https://file-examples.com/storage/fe68c8777d66f45d7a9f0c5/2017/11/file_example_MP3_700KB.mp3',
                coverUrl: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=peaceful%20nature%20music%20album%20cover&image_size=square',
                duration: 180,
                genre: 'Ambient',
                artist: 'Suno AI',
                createdAt: new Date().toISOString(),
                source: 'suno'
            },
            {
                id: 'suno_example_2',
                title: 'Ritmo Energético',
                audioUrl: 'https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3',
                audioUrlOption1: 'https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3',
                coverUrl: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=energetic%20electronic%20music%20album%20cover&image_size=square',
                duration: 210,
                genre: 'Electronic',
                artist: 'Suno AI',
                createdAt: new Date().toISOString(),
                source: 'suno'
            }
        ];
        return exampleSongs;
    }
};
// Importações necessárias para o sistema de identidade
import { getOrCreateGuestId } from '../utils/guest';
import { GUEST_ID_HEADER } from '../types/guest';
// Função helper para fazer requisições com tratamento de erro e identidade
export const apiRequest = async (endpoint, options = {}) => {
    const { method = 'GET', body, headers = {} } = options;
    try {
        // Importação dinâmica do store para evitar problemas de dependência circular
        const { useAuthStore } = await import('../store/authStore');
        const { token, isLoggedIn } = useAuthStore.getState();
        // Configurar headers de autenticação e identidade
        const requestHeaders = {
            'Content-Type': 'application/json',
            ...headers
        };
        // Sempre incluir o deviceId em todas as requisições
        const deviceId = localStorage.getItem('deviceId');
        if (deviceId) {
            requestHeaders['x-device-id'] = deviceId;
        }
        if (isLoggedIn && token) {
            // Usuário autenticado: usar token de autorização
            requestHeaders['Authorization'] = `Bearer ${token}`;
            console.debug('[API] Requisição com usuário autenticado');
        }
        else {
            // Usuário convidado: usar guestId
            const guestId = getOrCreateGuestId();
            requestHeaders[GUEST_ID_HEADER] = guestId;
            console.debug('[API] Requisição com guestId:', guestId);
        }
        // Construir URL completa
        const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
        const config = {
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
                }
                catch (parseError) {
                    // Se não conseguir fazer parse, usa o texto como está
                    errorData = { message: errorText };
                }
            }
            catch (readError) {
                // Se não conseguir ler a resposta
                console.error('[API] Erro ao ler resposta de erro:', readError);
                errorData = { message: `API Error: ${response.status} ${response.statusText}` };
            }
            // Criar erro customizado com informações do status HTTP
            const errorMessage = errorData.message || `API Error: ${response.status} ${response.statusText}`;
            const error = new Error(errorMessage);
            // Adicionar propriedade status para identificação específica de erros HTTP
            error.status = response.status;
            error.statusText = response.statusText;
            error.data = errorData;
            throw error;
        }
        const data = await response.json();
        console.debug('[API] Resposta recebida:', data);
        return data;
    }
    catch (error) {
        console.error('[API] Erro na requisição:', error);
        throw error;
    }
};
// Função legacy mantida para compatibilidade
export const legacyApiRequest = async (url, options = {}) => {
    return apiRequest(url, {
        method: options.method || 'GET',
        body: options.body ? JSON.parse(options.body) : undefined,
        headers: options.headers
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
}
else {
    // Em produção, apenas log se houver erro de configuração
    if (!apiConfig.apiBaseUrl) {
        console.error('❌ API Configuration Error: VITE_PROD_API_URL não definida!');
    }
}
//# sourceMappingURL=api.js.map