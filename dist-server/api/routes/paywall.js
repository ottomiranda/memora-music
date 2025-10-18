/**
 * Paywall API routes
 * Handle user creation status, mock payments, and paywall protection
 */
import { Router } from 'express';
import { getSupabaseServiceClient } from '../../src/lib/supabase-client.js';
import { optionalAuthMiddleware } from '../middleware/optionalAuth.js';
import { hasUnlimitedAccess, normalizeIds, resolveFreeUsage } from '../lib/paywall-utils.js';
const router = Router();
// Função para obter cliente Supabase sob demanda (compatibilidade)
const getSupabaseClient = () => {
    return getSupabaseServiceClient();
};
const ipFallbackMetrics = {
    totalAttempts: 0,
    totalHits: 0,
    byDay: {},
    byTtlDays: {},
};
const recordIpFallback = (used, ttlDays) => {
    try {
        const day = new Date().toISOString().slice(0, 10);
        ipFallbackMetrics.totalAttempts += 1;
        ipFallbackMetrics.byDay[day] = ipFallbackMetrics.byDay[day] || { attempts: 0, hits: 0 };
        ipFallbackMetrics.byTtlDays[String(ttlDays)] = ipFallbackMetrics.byTtlDays[String(ttlDays)] || { attempts: 0, hits: 0 };
        ipFallbackMetrics.byDay[day].attempts += 1;
        ipFallbackMetrics.byTtlDays[String(ttlDays)].attempts += 1;
        if (used) {
            ipFallbackMetrics.totalHits += 1;
            ipFallbackMetrics.byDay[day].hits += 1;
            ipFallbackMetrics.byTtlDays[String(ttlDays)].hits += 1;
        }
    }
    catch (e) {
        // Não quebrar o fluxo por causa de métricas
    }
};
// Função auxiliar para extrair userId do token usando Supabase Auth
const extractUserIdFromToken = async (jwt) => {
    try {
        const supabase = getSupabaseClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
        if (userError) {
            console.error('[AUTH_ERROR] Erro ao obter usuário do token:', userError);
            return null;
        }
        if (user) {
            console.log('[AUTH] Usuário autenticado com UUID:', user.id);
            return user.id;
        }
        return null;
    }
    catch (authError) {
        console.error('[AUTH_EXCEPTION] Exceção ao validar token:', authError);
        return null;
    }
};
// Função auxiliar para gerar ID de transação simulada
const generateTransactionId = () => {
    return `mock_txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
/**
 * Get User Creation Status
 * GET /api/user/creation-status
 * Public route - works for both authenticated and guest users
 * Robust implementation with fallback logic for guest users
 */
router.get('/creation-status', optionalAuthMiddleware, async (req, res) => {
    try {
        console.log('[DEBUG] Rota /creation-status atingida');
        // Extrair userId de forma segura usando optional chaining
        const requestWithUser = req;
        const userId = requestWithUser.user?.id;
        const deviceId = req.headers['x-device-id'];
        const guestId = req.headers['x-guest-id'];
        const clientIp = req.ip;
        console.log('[DEBUG] Dados de identificação:', { userId, deviceId, clientIp });
        const supabase = getSupabaseClient();
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        console.log('[SUPABASE_CONFIG] Verificando configuração:', {
            hasUrl: !!supabaseUrl,
            hasServiceKey: !!supabaseServiceKey,
            urlLength: supabaseUrl?.length || 0,
            keyLength: supabaseServiceKey?.length || 0,
            nodeEnv: process.env.NODE_ENV,
            timestamp: new Date().toISOString()
        });
        if (!supabaseUrl || !supabaseServiceKey) {
            console.error('[SUPABASE_CONFIG_ERROR] Variáveis de ambiente não configuradas:', {
                SUPABASE_URL: supabaseUrl ? 'definida' : 'UNDEFINED',
                SUPABASE_SERVICE_ROLE_KEY: supabaseServiceKey ? 'definida' : 'UNDEFINED',
                allEnvKeys: Object.keys(process.env).filter(key => key.includes('SUPABASE')),
                nodeEnv: process.env.NODE_ENV
            });
            return res.status(500).json({
                success: false,
                error: 'Configuração do servidor incompleta',
                message: 'Serviço temporariamente indisponível',
                debug: process.env.NODE_ENV === 'development' ? {
                    missingVars: {
                        SUPABASE_URL: !supabaseUrl,
                        SUPABASE_SERVICE_ROLE_KEY: !supabaseServiceKey
                    }
                } : undefined
            });
        }
        let foundUser = null;
        let findError = null;
        let usageRecords = [];
        try {
            const usage = await resolveFreeUsage(supabase, {
                userId,
                deviceIds: [deviceId, guestId],
            });
            usageRecords = usage.records;
            if (usage.records.length > 0) {
                foundUser = {
                    freesongsused: usage.maxFreeSongs,
                    device_id: usage.primaryRecord?.device_id ?? usage.records.find(record => record.device_id)?.device_id ?? null,
                };
            }
        }
        catch (error) {
            console.error('[PAYWALL_ERROR] Erro ao consolidar contagem de músicas gratuitas:', error);
            findError = error;
        }
        // 3) Se ainda não encontrado, fallback por IP com TTL (configurável)
        if (!foundUser && clientIp) {
            const ttlDays = Number(process.env.IP_FALLBACK_TTL_DAYS || '7');
            const cutoff = new Date(Date.now() - ttlDays * 24 * 60 * 60 * 1000).toISOString();
            console.log('[DEBUG] Fallback por IP (prioridade 3):', { clientIp, ttlDays, cutoff });
        const { data, error } = await supabase
            .from('user_creations')
            .select('freesongsused')
            .eq('last_used_ip', clientIp)
            .gte('created_at', cutoff)
            .order('created_at', { ascending: false })
            .maybeSingle();
            recordIpFallback(!!data, ttlDays);
            if (data) {
                foundUser = { freesongsused: data.freesongsused || 0, device_id: null };
            }
            if (error && error.code !== 'PGRST116') {
                console.error('[PAYWALL_ERROR] Erro ao buscar usuário por IP:', JSON.stringify(error, null, 2));
                findError = error;
            }
        }
        if (findError) {
            console.error('[ERROR] Erro ao buscar usuário no Supabase:', findError);
            // Em caso de erro, assumir novo usuário para não bloquear o fluxo
            res.status(200).json({
                success: true,
                isFree: true,
                freeSongsUsed: 0,
                message: 'Primeira música é gratuita (fallback por erro)',
                userType: userId ? 'authenticated' : (deviceId ? 'guest_device' : 'guest_ip')
            });
            return;
        }
        if (!foundUser) {
            console.log('[DEBUG] Nenhum usuário encontrado - novo convidado');
            const premiumDeviceCandidates = [deviceId, guestId];
            const premiumAccess = await hasUnlimitedAccess(supabase, {
                userId,
                deviceIds: premiumDeviceCandidates,
            });
            if (premiumAccess.hasAccess) {
                console.log('[PAYWALL] Plano ativo detectado para convidado sem registro - acesso ilimitado liberado');
                res.status(200).json({
                    success: true,
                    isFree: true,
                    freeSongsUsed: 0,
                    message: 'Plano ativo: criações ilimitadas liberadas.',
                    userType: userId ? 'authenticated_premium' : 'guest_premium',
                    hasUnlimitedAccess: true,
                });
                return;
            }
            res.status(200).json({
                success: true,
                isFree: true,
                freeSongsUsed: 0,
                message: 'Primeira música é gratuita para convidados',
                userType: userId ? 'new_authenticated' : (deviceId ? 'new_guest_device' : 'new_guest_ip')
            });
            return;
        }
        const usageDeviceIds = usageRecords
            .map(record => record.device_id)
            .filter((value) => Boolean(value));
        const premiumDeviceCandidates = normalizeIds([
            deviceId,
            guestId,
            foundUser.device_id ?? null,
            ...usageDeviceIds,
        ]);
        const premiumAccess = await hasUnlimitedAccess(supabase, {
            userId,
            deviceIds: premiumDeviceCandidates,
        });
        if (premiumAccess.hasAccess) {
            console.log('[PAYWALL] Plano ativo detectado - ignorando limite de criações gratuitas');
            res.status(200).json({
                success: true,
                isFree: true,
                freeSongsUsed: foundUser.freesongsused || 0,
                message: 'Plano ativo: criações ilimitadas liberadas.',
                userType: userId ? 'authenticated_premium' : 'guest_premium',
                hasUnlimitedAccess: true,
            });
            return;
        }
        const FREE_SONG_LIMIT = 1;
        const freeSongsUsed = foundUser.freesongsused || 0;
        const isFree = freeSongsUsed < FREE_SONG_LIMIT;
        console.log('[DEBUG] Status do usuário encontrado:', { freeSongsUsed, isFree, userType: userId ? 'authenticated' : (deviceId ? 'guest_device' : 'guest_ip') });
        res.status(200).json({
            success: true,
            isFree,
            freeSongsUsed,
            message: isFree ? 'Próxima música é gratuita' : 'Próxima música será paga',
            userType: userId
                ? 'authenticated'
                : (deviceId ? 'guest_device' : (guestId ? 'guest_id' : 'guest_ip'))
        });
    }
    catch (error) {
        console.error('[ERROR] Erro na rota /creation-status:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});
// Endpoint auxiliar para consultar métricas de fallback por IP (uso interno/diagnóstico)
router.get('/creation-status/metrics', (req, res) => {
    res.status(200).json({ success: true, metrics: ipFallbackMetrics });
});
/**
 * Confirm Mock Payment
 * POST /api/confirm-mock-payment
 */
router.post('/confirm-mock-payment', async (req, res) => {
    try {
        console.log('[DEBUG] Rota /confirm-mock-payment atingida. req.body:', req.body);
        // Verificar token de autenticação
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('[DEBUG] Token de autenticação ausente');
            res.status(401).json({
                success: false,
                message: 'Token de autenticação necessário'
            });
            return;
        }
        const token = authHeader.split(' ')[1];
        const userId = await extractUserIdFromToken(token);
        if (!userId) {
            console.log('[DEBUG] Token inválido');
            res.status(401).json({
                success: false,
                message: 'Token inválido'
            });
            return;
        }
        const { amount, paymentMethod } = req.body;
        // Validação dos dados de entrada
        if (!amount || typeof amount !== 'number' || amount <= 0) {
            console.log('[DEBUG] Valor inválido:', amount);
            res.status(400).json({
                success: false,
                message: 'Valor do pagamento inválido'
            });
            return;
        }
        if (!paymentMethod || typeof paymentMethod !== 'string') {
            console.log('[DEBUG] Método de pagamento inválido:', paymentMethod);
            res.status(400).json({
                success: false,
                message: 'Método de pagamento inválido'
            });
            return;
        }
        console.log('[DEBUG] Processando pagamento simulado:', { userId, amount, paymentMethod });
        // Gerar ID da transação simulada
        const transactionId = generateTransactionId();
        // Salvar transação simulada no banco
        const supabase = getSupabaseClient();
        const { error: transactionError } = await supabase
            .from('mock_transactions')
            .insert({
            userid: userId,
            transactionid: transactionId,
            amount: Math.round(amount * 100), // Converter para centavos
            paymentmethod: paymentMethod,
            status: 'completed'
        });
        if (transactionError) {
            console.error('[ERROR] Erro ao salvar transação:', transactionError);
            res.status(500).json({
                success: false,
                message: 'Erro ao processar pagamento'
            });
            return;
        }
        console.log('[DEBUG] Pagamento simulado confirmado:', { transactionId });
        res.status(200).json({
            success: true,
            transactionId,
            message: 'Pagamento simulado confirmado com sucesso'
        });
    }
    catch (error) {
        console.error('[ERROR] Erro na rota /confirm-mock-payment:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});
export default router;
//# sourceMappingURL=paywall.js.map
