/**
 * Cliente Supabase Robusto com Retry Logic e Error Handling
 * Implementa conexão estável e confiável com o Supabase
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
// Carregar variáveis de ambiente se não estiverem carregadas
if (!process.env.SUPABASE_URL) {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    dotenv.config({ path: path.resolve(__dirname, '../../.env') });
}
// Configuração padrão de retry (convertido de TypeScript para JavaScript)
const DEFAULT_RETRY_CONFIG = {
    maxRetries: 3,
    baseDelay: 1000, // 1 segundo
    maxDelay: 10000, // 10 segundos
    backoffMultiplier: 2
};
// Classe para gerenciar conexões Supabase
class SupabaseManager {
    constructor() {
        this.serviceClient = null;
        this.anonClient = null;
        this.connectionStatus = 'disconnected';
        this.lastConnectionTest = 0;
        this.CONNECTION_TEST_INTERVAL = 30000; // 30 segundos
        this.config = null;
    }
    static getInstance() {
        if (!SupabaseManager.instance) {
            SupabaseManager.instance = new SupabaseManager();
        }
        return SupabaseManager.instance;
    }
    loadConfig() {
        if (this.config) {
            return this.config; // Já carregado
        }
        const url = process.env.SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const anonKey = process.env.SUPABASE_ANON_KEY;
        if (!url || !serviceRoleKey || !anonKey) {
            throw new Error('Configuração do Supabase incompleta. Verifique as variáveis: ' +
                'SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY');
        }
        this.config = {
            url,
            serviceRoleKey,
            anonKey,
            retry: DEFAULT_RETRY_CONFIG
        };
        console.log('[SUPABASE] Configuração carregada:', {
            url: this.config.url,
            hasServiceKey: !!this.config.serviceRoleKey,
            hasAnonKey: !!this.config.anonKey
        });
        return this.config;
    }
    /**
     * Obtém cliente com Service Role (para operações administrativas)
     */
    getServiceClient() {
        this.loadConfig(); // Garantir que a configuração está carregada
        if (!this.serviceClient) {
            this.serviceClient = createClient(this.config.url, this.config.serviceRoleKey, {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                },
                realtime: {
                    params: {
                        eventsPerSecond: 10
                    }
                }
            });
        }
        return this.serviceClient;
    }
    /**
     * Obtém cliente anônimo (para operações do frontend)
     */
    getAnonClient() {
        this.loadConfig(); // Garantir que a configuração está carregada
        if (!this.anonClient) {
            this.anonClient = createClient(this.config.url, this.config.anonKey, {
                auth: {
                    autoRefreshToken: true,
                    persistSession: true
                }
            });
        }
        return this.anonClient;
    }
    /**
     * Executa operação com retry automático
     */
    async withRetry(operation, customRetryConfig) {
        const retryConfig = { ...this.config.retry, ...customRetryConfig };
        let lastError;
        for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
            try {
                const result = await operation();
                // Se chegou aqui, a operação foi bem-sucedida
                if (attempt > 0) {
                    console.log(`[SUPABASE] Operação bem-sucedida após ${attempt} tentativas`);
                }
                this.connectionStatus = 'connected';
                return result;
            }
            catch (error) {
                lastError = error;
                // Log do erro
                console.error(`[SUPABASE] Tentativa ${attempt + 1}/${retryConfig.maxRetries + 1} falhou:`, error);
                // Se é a última tentativa, não faz retry
                if (attempt === retryConfig.maxRetries) {
                    this.connectionStatus = 'disconnected';
                    break;
                }
                // Calcular delay para próxima tentativa
                const delay = Math.min(retryConfig.baseDelay * Math.pow(retryConfig.backoffMultiplier, attempt), retryConfig.maxDelay);
                console.log(`[SUPABASE] Aguardando ${delay}ms antes da próxima tentativa...`);
                await this.sleep(delay);
            }
        }
        throw new Error(`Operação falhou após ${retryConfig.maxRetries + 1} tentativas. ` +
            `Último erro: ${lastError.message}`);
    }
    /**
     * Testa conectividade com o Supabase
     */
    async testConnection() {
        try {
            const now = Date.now();
            // Evita testes muito frequentes
            if (now - this.lastConnectionTest < this.CONNECTION_TEST_INTERVAL) {
                return this.connectionStatus === 'connected';
            }
            this.connectionStatus = 'connecting';
            this.lastConnectionTest = now;
            const client = this.getServiceClient();
            const { error } = await client
                .from('users')
                .select('count')
                .limit(1);
            if (error) {
                console.error('[SUPABASE] Teste de conexão falhou:', error.message);
                this.connectionStatus = 'disconnected';
                return false;
            }
            this.connectionStatus = 'connected';
            return true;
        }
        catch (error) {
            console.error('[SUPABASE] Exceção durante teste de conexão:', error);
            this.connectionStatus = 'disconnected';
            return false;
        }
    }
    /**
     * Executa operação de banco com retry e validação
     */
    async executeQuery(queryFn, useServiceRole = true) {
        return this.withRetry(async () => {
            // Testa conexão antes de executar query crítica
            if (!(await this.testConnection())) {
                throw new Error('Conexão com Supabase não disponível');
            }
            const client = useServiceRole ? this.getServiceClient() : this.getAnonClient();
            const { data, error } = await queryFn(client);
            if (error) {
                throw new Error(`Erro na query: ${error.message}`);
            }
            return data;
        });
    }
    /**
     * Obtém status da conexão
     */
    getConnectionStatus() {
        return this.connectionStatus;
    }
    /**
     * Força reconexão
     */
    async reconnect() {
        console.log('[SUPABASE] Forçando reconexão...');
        // Reset dos clientes
        this.serviceClient = null;
        this.anonClient = null;
        this.connectionStatus = 'disconnected';
        this.lastConnectionTest = 0;
        return this.testConnection();
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
// Instância singleton (lazy initialization)
let supabaseManager = null;
function getManager() {
    if (!supabaseManager) {
        supabaseManager = SupabaseManager.getInstance();
    }
    return supabaseManager;
}
// Funções de conveniência para uso no código
export function getSupabaseServiceClient() {
    return getManager().getServiceClient();
}
export function getSupabaseAnonClient() {
    return getManager().getAnonClient();
}
export async function executeSupabaseQuery(queryFn, useServiceRole = true) {
    try {
        const result = await getManager().executeQuery(queryFn, useServiceRole);
        return { success: true, data: result, error: null };
    }
    catch (error) {
        return { success: false, data: null, error: error.message };
    }
}
export async function testSupabaseConnection() {
    return getManager().testConnection();
}
export async function reconnectSupabase() {
    return getManager().reconnect();
}
export function getSupabaseConnectionStatus() {
    return getManager().getConnectionStatus();
}
// Função para criar cliente com configuração específica (compatibilidade)
export function createSupabaseClient(useServiceRole = true) {
    return useServiceRole ? getSupabaseServiceClient() : getSupabaseAnonClient();
}
// Export do manager para casos avançados
export { SupabaseManager };
// Função legacy para compatibilidade
export function getSupabaseClient() {
    return getSupabaseServiceClient();
}
export default { getManager };
//# sourceMappingURL=supabase-client.js.map