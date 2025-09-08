import { testSupabaseConnection } from '../src/lib/supabase-client';
// Configurar CORS
function setCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}
// Função para mascarar chaves sensíveis
function maskSensitiveValue(value) {
    if (!value)
        return 'NOT_SET';
    if (value.length <= 8)
        return '***';
    return value.substring(0, 4) + '***' + value.substring(value.length - 4);
}
// Validação de variáveis de ambiente
function checkEnvironmentVariables() {
    const envVars = {
        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
        NODE_ENV: process.env.NODE_ENV
    };
    const status = {
        SUPABASE_URL: {
            configured: !!envVars.SUPABASE_URL,
            masked_value: maskSensitiveValue(envVars.SUPABASE_URL),
            valid_format: envVars.SUPABASE_URL?.includes('supabase.co') || false
        },
        SUPABASE_SERVICE_ROLE_KEY: {
            configured: !!envVars.SUPABASE_SERVICE_ROLE_KEY,
            masked_value: maskSensitiveValue(envVars.SUPABASE_SERVICE_ROLE_KEY),
            valid_format: envVars.SUPABASE_SERVICE_ROLE_KEY?.startsWith('eyJ') || false
        },
        NODE_ENV: envVars.NODE_ENV || 'unknown'
    };
    return status;
}
// Testar conexão com Supabase usando cliente importado
async function testSupabaseConnectionInternal() {
    try {
        // Usar o cliente importado do módulo
        const result = await testSupabaseConnection();
        return result;
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
export default async function handler(req, res) {
    // Configurar CORS
    setCorsHeaders(res);
    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    // Apenas GET é permitido
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed. Use GET only.'
        });
    }
    try {
        console.log('🔍 === DEBUG ENDPOINT ===');
        console.log('📝 Method:', req.method);
        console.log('🌍 Environment check starting...');
        // Verificar variáveis de ambiente
        const envStatus = checkEnvironmentVariables();
        console.log('✅ Environment variables checked');
        // Testar conexão com Supabase
        console.log('🔗 Testing Supabase connection...');
        const connectionTest = await testSupabaseConnectionInternal();
        console.log('✅ Supabase connection tested');
        // Informações do sistema
        const systemInfo = {
            timestamp: new Date().toISOString(),
            platform: process.platform,
            node_version: process.version,
            memory_usage: process.memoryUsage(),
            uptime: process.uptime()
        };
        const response = {
            success: true,
            debug_info: {
                environment_variables: envStatus,
                supabase_connection: connectionTest,
                system_info: systemInfo
            }
        };
        console.log('🎯 Debug response prepared');
        return res.status(200).json(response);
    }
    catch (error) {
        console.error('❌ Erro no endpoint debug:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? {
                message: error instanceof Error ? error.message : 'Unknown error'
            } : undefined
        });
    }
}
//# sourceMappingURL=debug.js.map