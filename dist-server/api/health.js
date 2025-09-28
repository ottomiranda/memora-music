import { testSupabaseConnection } from '../src/lib/supabase-client.js';
export default async function handler(req, res) {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-guest-id');
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }
    try {
        console.log('🏥 Health check endpoint chamado');
        // Verificar variáveis de ambiente críticas
        const envChecks = {
            OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
            SUNO_API_KEY: !!process.env.SUNO_API_KEY,
            SUPABASE_URL: !!process.env.SUPABASE_URL,
            SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY
        };
        const allEnvVarsPresent = Object.values(envChecks).every(Boolean);
        // Testar conexão com Supabase usando cliente robusto
        let supabaseStatus = 'unknown';
        try {
            const result = await testSupabaseConnection();
            supabaseStatus = result.success ? 'connected' : 'error';
        }
        catch (error) {
            supabaseStatus = 'error';
        }
        const healthData = {
            success: true,
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            version: process.env.npm_package_version || '1.0.0',
            node_version: process.version,
            platform: process.platform,
            arch: process.arch,
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
                external: Math.round(process.memoryUsage().external / 1024 / 1024)
            },
            env_checks: envChecks,
            all_env_vars_present: allEnvVarsPresent,
            supabase_status: supabaseStatus
        };
        console.log('✅ Health check concluído:', {
            status: healthData.status,
            env_vars_ok: allEnvVarsPresent,
            memory_used: `${healthData.memory.used}MB`
        });
        return res.status(200).json(healthData);
    }
    catch (error) {
        console.log('❌ Erro no health check:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        return res.status(500).json({
            success: false,
            status: 'unhealthy',
            error: 'Erro interno do servidor',
            details: errorMessage,
            timestamp: new Date().toISOString()
        });
    }
}
//# sourceMappingURL=health.js.map