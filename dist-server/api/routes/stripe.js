import { Router } from 'express';
import { z } from 'zod';
import Stripe from 'stripe';
import { getSupabaseServiceClient } from '../../src/lib/supabase-client.js';
import { sendEmail } from '../lib/mailer.js';
import { optionalAuthMiddleware } from '../middleware/optionalAuth.js';
import rateLimit from 'express-rate-limit';
const router = Router();
// Initialize Stripe with secret key
// Initialize Stripe (use SDK default API version to avoid invalid dates)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
// Rate limiting for payment endpoints
const paymentRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 requests per windowMs
    message: {
        success: false,
        message: 'Muitas tentativas de pagamento. Tente novamente em 15 minutos.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
/**
 * Public publishable key endpoint
 * GET /api/stripe/public-key
 * Returns the publishable key for the frontend when not available at build time
 */
router.get('/public-key', (req, res) => {
    const publishable = process.env.STRIPE_PUBLISHABLE_KEY || process.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!publishable) {
        res.status(500).json({ success: false, message: 'Stripe publishable key not configured' });
        return;
    }
    res.status(200).json({ success: true, publishableKey: publishable });
});
/**
 * Finalize payment and unlock quota (server-side verification)
 * POST /api/stripe/finalize
 * Body: { paymentIntentId: string, deviceId?: string }
 */
router.post('/finalize', paymentRateLimit, optionalAuthMiddleware, async (req, res) => {
    try {
        const { paymentIntentId, deviceId } = req.body;
        if (!paymentIntentId || typeof paymentIntentId !== 'string') {
            res.status(400).json({ success: false, message: 'paymentIntentId é obrigatório' });
            return;
        }
        // Retrieve intent from Stripe to verify success
        const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
        // Para métodos assíncronos (ex: boleto, pix), libere somente no webhook quando status=succeeded
        if (pi.status !== 'succeeded') {
            res.status(202).json({ success: false, message: `Pagamento em processamento (status: ${pi.status}). A liberação ocorrerá após confirmação via webhook.` });
            return;
        }
        const supabase = getSupabaseServiceClient();
        const clientIp = req.ip;
        // Update transaction row if exists
        await supabase
            .from('stripe_transactions')
            .update({ status: 'succeeded', stripe_payment_intent_data: pi, updated_at: new Date().toISOString() })
            .eq('payment_intent_id', paymentIntentId);
        // Determine identity: prefer authenticated user, then metadata.userId, else deviceId
        let targetUserId = req.user?.id || null;
        const metaUserId = pi.metadata?.userId || null;
        const targetDeviceId = deviceId || pi.metadata?.deviceId || null;
        if (!targetUserId && metaUserId) {
            targetUserId = metaUserId;
        }
        // Reset quota by updating freesongsused counter to 0 (keep records for history)
        const results = [];
        try {
            if (targetUserId) {
                // Reset freesongsused counter for this user to 0
                const { error } = await supabase
                    .from('user_creations')
                    .update({
                    freesongsused: 0,
                    creations: 0,
                    updated_at: new Date().toISOString()
                })
                    .eq('user_id', targetUserId);
                results.push({ target: 'userId', updated: !error });
                console.log('[STRIPE_FINALIZE] Reset quota for userId:', targetUserId, 'success:', !error);
            }
        }
        catch (e) {
            console.warn('[STRIPE_FINALIZE] Falha ao resetar por userId', e);
        }
        try {
            if (targetDeviceId) {
                // Reset freesongsused counter for this device_id
                const { error } = await supabase
                    .from('user_creations')
                    .update({
                    freesongsused: 0,
                    creations: 0,
                    updated_at: new Date().toISOString()
                })
                    .eq('device_id', targetDeviceId)
                    .is('user_id', null);
                results.push({ target: 'deviceId', updated: !error });
                console.log('[STRIPE_FINALIZE] Reset quota for deviceId:', targetDeviceId, 'success:', !error);
            }
        }
        catch (e) {
            console.warn('[STRIPE_FINALIZE] Falha ao resetar por deviceId', e);
        }
        // Extra: também resetar por IP para evitar bloqueio pelo filtro OR
        try {
            if (clientIp) {
                // Reset freesongsused counter for this IP
                const { error } = await supabase
                    .from('user_creations')
                    .update({
                    freesongsused: 0,
                    creations: 0,
                    updated_at: new Date().toISOString()
                })
                    .eq('last_used_ip', clientIp)
                    .is('user_id', null);
                results.push({ target: 'last_used_ip', updated: !error });
                console.log('[STRIPE_FINALIZE] Reset quota for IP:', clientIp, 'success:', !error);
            }
        }
        catch (e) {
            console.warn('[STRIPE_FINALIZE] Falha ao resetar por last_used_ip', e);
        }
        res.status(200).json({ success: true, message: 'Pagamento verificado e cota liberada', results });
    }
    catch (err) {
        console.error('[STRIPE_FINALIZE] Erro:', err);
        res.status(500).json({ success: false, message: 'Erro ao finalizar pagamento' });
    }
});
// Webhook rate limiting
const webhookRateLimit = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // allow more webhook calls
    message: {
        success: false,
        message: 'Webhook rate limit exceeded'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
// Validation schemas
const createPaymentIntentSchema = z.object({
    amount: z.number().min(100, 'Valor mínimo é R$ 1,00 ou $1.00').max(100000, 'Valor máximo é R$ 1.000,00 ou $1.000.00'),
    currency: z.enum(['brl', 'usd'], { errorMap: () => ({ message: 'Moeda deve ser BRL ou USD' }) }),
    metadata: z.object({
        userId: z.string().optional(),
        deviceId: z.string().optional(),
        productType: z.string().default('music_generation'),
        description: z.string().optional()
    }).optional()
});
const confirmPaymentSchema = z.object({
    paymentIntentId: z.string().min(1, 'Payment Intent ID é obrigatório'),
    paymentMethodId: z.string().min(1, 'Payment Method ID é obrigatório')
});
// Função para obter cliente Supabase
const getSupabaseClient = () => {
    return getSupabaseServiceClient();
};
// Função auxiliar para extrair userId do token
const extractUserIdFromToken = async (jwt) => {
    try {
        const supabase = getSupabaseClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
        if (userError) {
            console.error('[STRIPE_AUTH_ERROR] Erro ao obter usuário do token:', userError);
            return null;
        }
        if (user) {
            console.log('[STRIPE_AUTH] Usuário autenticado com UUID:', user.id);
            return user.id;
        }
        return null;
    }
    catch (authError) {
        console.error('[STRIPE_AUTH_EXCEPTION] Exceção ao validar token:', authError);
        return null;
    }
};
/**
 * Create Payment Intent
 * POST /api/stripe/create-payment-intent
 */
router.post('/create-payment-intent', paymentRateLimit, optionalAuthMiddleware, async (req, res) => {
    try {
        console.log('[STRIPE] Criando Payment Intent:', req.body);
        // Validar dados de entrada
        const validationResult = createPaymentIntentSchema.safeParse(req.body);
        if (!validationResult.success) {
            console.error('[STRIPE_VALIDATION] Erro de validação:', validationResult.error.errors);
            res.status(400).json({
                success: false,
                message: 'Dados inválidos',
                errors: validationResult.error.errors
            });
            return;
        }
        const { amount, currency, metadata } = validationResult.data;
        // Extrair userId se autenticado
        let userId = null;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            userId = await extractUserIdFromToken(token);
        }
        // Criar Payment Intent no Stripe
        let paymentIntent;
        const paymentMetadata = {
            userId: userId || 'guest',
            deviceId: metadata?.deviceId || '',
            productType: metadata?.productType || 'music_generation',
            description: metadata?.description || (currency === 'usd' ? 'Premium music generation' : 'Geração de música premium'),
            timestamp: new Date().toISOString(),
        };
        try {
            if (currency === 'usd') {
                // Para USD, usar apenas cartão (métodos internacionais)
                paymentIntent = await stripe.paymentIntents.create({
                    amount: Math.round(amount),
                    currency: 'usd',
                    payment_method_types: ['card'],
                    metadata: paymentMetadata,
                });
            }
            else {
                // Para BRL, tentar métodos brasileiros (cartão, boleto e pix)
                paymentIntent = await stripe.paymentIntents.create({
                    amount: Math.round(amount),
                    currency: 'brl',
                    payment_method_types: ['card', 'boleto', 'pix'],
                    payment_method_options: {
                        boleto: { expires_after_days: 5 },
                        pix: { expires_after_seconds: 60 * 60 },
                    },
                    metadata: paymentMetadata,
                });
            }
        }
        catch (e) {
            // Fallback: usar APM automáticos
            console.warn('[STRIPE] Falha ao usar payment_method_types específicos, aplicando fallback automático');
            paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(amount),
                currency: currency,
                automatic_payment_methods: { enabled: true },
                metadata: paymentMetadata,
            });
        }
        // Salvar transação no banco
        const supabase = getSupabaseClient();
        const { error: dbError } = await supabase
            .from('stripe_transactions')
            .insert({
            payment_intent_id: paymentIntent.id,
            user_id: userId,
            amount: amount,
            currency: currency,
            status: 'created',
            metadata: metadata || {},
            created_at: new Date().toISOString()
        });
        if (dbError) {
            console.error('[STRIPE_DB_ERROR] Erro ao salvar transação:', dbError);
            // Não falhar a criação do Payment Intent por erro de DB
        }
        console.log('[STRIPE] Payment Intent criado:', paymentIntent.id);
        res.status(200).json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            amount: amount,
            currency: currency
        });
    }
    catch (error) {
        console.error('[STRIPE_ERROR] Erro ao criar Payment Intent:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor ao processar pagamento'
        });
    }
});
/**
 * Confirm Payment
 * POST /api/stripe/confirm-payment
 */
router.post('/confirm-payment', paymentRateLimit, optionalAuthMiddleware, async (req, res) => {
    try {
        console.log('[STRIPE] Confirmando pagamento:', req.body);
        // Validar dados de entrada
        const validationResult = confirmPaymentSchema.safeParse(req.body);
        if (!validationResult.success) {
            console.error('[STRIPE_VALIDATION] Erro de validação:', validationResult.error.errors);
            res.status(400).json({
                success: false,
                message: 'Dados inválidos',
                errors: validationResult.error.errors
            });
            return;
        }
        const { paymentIntentId, paymentMethodId } = validationResult.data;
        // Confirmar Payment Intent no Stripe
        const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
            payment_method: paymentMethodId,
            return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/success`
        });
        // Atualizar status no banco
        const supabase = getSupabaseClient();
        const { error: updateError } = await supabase
            .from('stripe_transactions')
            .update({
            status: paymentIntent.status,
            payment_method_id: paymentMethodId,
            updated_at: new Date().toISOString()
        })
            .eq('payment_intent_id', paymentIntentId);
        if (updateError) {
            console.error('[STRIPE_DB_ERROR] Erro ao atualizar transação:', updateError);
        }
        console.log('[STRIPE] Pagamento confirmado:', paymentIntent.id, 'Status:', paymentIntent.status);
        res.status(200).json({
            success: true,
            paymentIntent: {
                id: paymentIntent.id,
                status: paymentIntent.status,
                client_secret: paymentIntent.client_secret
            }
        });
    }
    catch (error) {
        console.error('[STRIPE_ERROR] Erro ao confirmar pagamento:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor ao confirmar pagamento'
        });
    }
});
/**
 * Stripe Webhook
 * POST /api/stripe/webhook
 */
router.post('/webhook', webhookRateLimit, async (req, res) => {
    try {
        const sig = req.headers['stripe-signature'];
        const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
        // Debug: verificar tipo do body
        console.log('[STRIPE_WEBHOOK_DEBUG] Body type:', typeof req.body);
        console.log('[STRIPE_WEBHOOK_DEBUG] Body is Buffer:', Buffer.isBuffer(req.body));
        console.log('[STRIPE_WEBHOOK_DEBUG] Body constructor:', req.body?.constructor?.name);
        if (!endpointSecret) {
            console.error('[STRIPE_WEBHOOK] Webhook secret não configurado');
            res.status(400).json({ success: false, message: 'Webhook secret não configurado' });
            return;
        }
        let event;
        try {
            event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        }
        catch (err) {
            console.error('[STRIPE_WEBHOOK] Erro de verificação de assinatura:', err);
            res.status(400).json({ success: false, message: 'Assinatura inválida' });
            return;
        }
        console.log('[STRIPE_WEBHOOK] Evento recebido:', event.type, event.id);
        // Processar eventos do Stripe
        switch (event.type) {
            case 'payment_intent.succeeded':
                const paymentIntent = event.data.object;
                await handlePaymentSuccess(paymentIntent);
                break;
            case 'payment_intent.processing':
                const processingPayment = event.data.object;
                await handlePaymentProcessing(processingPayment);
                break;
            case 'payment_intent.payment_failed':
                const failedPayment = event.data.object;
                await handlePaymentFailure(failedPayment);
                break;
            default:
                console.log('[STRIPE_WEBHOOK] Evento não tratado:', event.type);
        }
        res.status(200).json({ success: true, received: true });
    }
    catch (error) {
        console.error('[STRIPE_WEBHOOK_ERROR] Erro no webhook:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor no webhook'
        });
    }
});
// Função para tratar pagamento bem-sucedido
async function handlePaymentSuccess(paymentIntent) {
    try {
        console.log('[STRIPE_WEBHOOK] Processando pagamento bem-sucedido:', paymentIntent.id);
        const supabase = getSupabaseClient();
        // Atualizar status da transação
        const { error: updateError } = await supabase
            .from('stripe_transactions')
            .update({
            status: 'succeeded',
            stripe_payment_intent_data: paymentIntent,
            updated_at: new Date().toISOString()
        })
            .eq('payment_intent_id', paymentIntent.id);
        if (updateError) {
            console.error('[STRIPE_WEBHOOK] Erro ao atualizar transação:', updateError);
            return;
        }
        // Se há userId nos metadados, resetar contador de músicas gratuitas
        const userId = paymentIntent.metadata?.userId;
        if (userId && userId !== 'guest') {
            const { error: resetError } = await supabase
                .from('user_creations')
                .update({ freesongsused: 0 })
                .eq('user_id', userId);
            if (resetError) {
                console.error('[STRIPE_WEBHOOK] Erro ao resetar contador de músicas:', resetError);
            }
            else {
                console.log('[STRIPE_WEBHOOK] Contador de músicas resetado para usuário:', userId);
            }
        }
        else {
            // Caso convidado: usar deviceId na metadata para resetar contador
            const deviceId = (paymentIntent.metadata?.deviceId || paymentIntent.metadata?.device_id);
            if (deviceId) {
                const { error: resetGuestError } = await supabase
                    .from('user_creations')
                    .update({ freesongsused: 0 })
                    .eq('device_id', deviceId);
                if (resetGuestError) {
                    console.error('[STRIPE_WEBHOOK] Erro ao resetar contador (guest por device_id):', resetGuestError);
                }
                else {
                    console.log('[STRIPE_WEBHOOK] Contador resetado para guest com device_id:', deviceId);
                }
            }
            else {
                console.warn('[STRIPE_WEBHOOK] Pagamento sem userId e sem deviceId na metadata. Nenhum reset aplicado.');
            }
        }
        console.log('[STRIPE_WEBHOOK] Pagamento processado com sucesso:', paymentIntent.id);
    }
    catch (error) {
        console.error('[STRIPE_WEBHOOK] Erro ao processar pagamento bem-sucedido:', error);
    }
}
// Função para tratar pagamento falhado
async function handlePaymentFailure(paymentIntent) {
    try {
        console.log('[STRIPE_WEBHOOK] Processando pagamento falhado:', paymentIntent.id);
        const supabase = getSupabaseClient();
        // Atualizar status da transação
        const { error: updateError } = await supabase
            .from('stripe_transactions')
            .update({
            status: 'failed',
            stripe_payment_intent_data: paymentIntent,
            updated_at: new Date().toISOString()
        })
            .eq('payment_intent_id', paymentIntent.id);
        if (updateError) {
            console.error('[STRIPE_WEBHOOK] Erro ao atualizar transação falhada:', updateError);
        }
        console.log('[STRIPE_WEBHOOK] Pagamento falhado processado:', paymentIntent.id);
    }
    catch (error) {
        console.error('[STRIPE_WEBHOOK] Erro ao processar pagamento falhado:', error);
    }
}
// Função para tratar pagamento em processamento (ex: boleto/pix)
async function handlePaymentProcessing(paymentIntent) {
    try {
        console.log('[STRIPE_WEBHOOK] Processando pagamento em processamento:', paymentIntent.id, 'status:', paymentIntent.status);
        const supabase = getSupabaseClient();
        // Extrair possíveis dados do boleto
        const nextAction = paymentIntent.next_action || {};
        const boletoDetails = nextAction?.boleto_display_details || {};
        const hostedVoucherUrl = boletoDetails?.hosted_voucher_url
            || paymentIntent?.charges?.data?.[0]?.payment_method_details?.boleto?.hosted_voucher_url
            || null;
        const boletoNumber = boletoDetails?.number || null;
        const expiresAt = boletoDetails?.expires_at || null; // epoch seconds
        // Atualizar status da transação para 'processing' + metadados úteis
        const { error: updateError } = await supabase
            .from('stripe_transactions')
            .update({
            status: 'processing',
            stripe_payment_intent_data: paymentIntent,
            metadata: {
                ...(paymentIntent.metadata || {}),
                voucher_url: hostedVoucherUrl,
                boleto_number: boletoNumber,
                expires_at: expiresAt,
            },
            updated_at: new Date().toISOString()
        })
            .eq('payment_intent_id', paymentIntent.id);
        if (updateError) {
            console.error('[STRIPE_WEBHOOK] Erro ao marcar transação como processing:', updateError);
        }
        // Enviar e-mail com boleto quando possível
        try {
            const userId = paymentIntent.metadata?.userId;
            if (userId && hostedVoucherUrl) {
                const { data: userRow } = await supabase
                    .from('user_creations')
                    .select('email, name')
                    .eq('id', userId)
                    .maybeSingle();
                const email = userRow?.email;
                if (email) {
                    const html = `
            <p>Olá${userRow?.name ? `, ${userRow.name}` : ''}!</p>
            <p>Seu boleto está pronto para pagamento. Acesse pelo link abaixo:</p>
            <p><a href="${hostedVoucherUrl}">Abrir boleto</a></p>
            ${expiresAt ? `<p>Vencimento: ${new Date((Number(expiresAt) || 0) * 1000).toLocaleString()}</p>` : ''}
            <p>Após a compensação, seu acesso será liberado automaticamente.</p>
          `;
                    const sent = await sendEmail({ to: email, subject: 'Seu boleto - Memora Music', html });
                    console.log('[STRIPE_WEBHOOK] Email com boleto', sent ? 'enviado' : 'não enviado');
                }
            }
        }
        catch (e) {
            console.warn('[STRIPE_WEBHOOK] Falha ao enviar email do boleto:', e);
        }
    }
    catch (error) {
        console.error('[STRIPE_WEBHOOK] Erro ao processar estado processing:', error);
    }
}
// Lista pagamentos pendentes do usuário (status processing)
router.get('/pending', optionalAuthMiddleware, async (req, res) => {
    try {
        const supabase = getSupabaseServiceClient();
        const userId = req.user?.id;
        const deviceId = req.headers['x-device-id'] || undefined;
        if (!userId && !deviceId) {
            res.status(400).json({ success: false, message: 'Identificação ausente (userId ou X-Device-ID)' });
            return;
        }
        let query = supabase.from('stripe_transactions').select('*').eq('status', 'processing');
        if (userId) {
            query = query.eq('user_id', userId);
        }
        else if (deviceId) {
            // Como guardamos deviceId em metadata, filtrar por JSON
            query = query.contains('metadata', { deviceId });
        }
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) {
            res.status(500).json({ success: false, message: 'Erro ao consultar pagamentos pendentes' });
            return;
        }
        const items = (data || []).map((row) => ({
            payment_intent_id: row.payment_intent_id,
            amount: row.amount,
            currency: row.currency,
            status: row.status,
            voucher_url: row?.metadata?.voucher_url || row?.stripe_payment_intent_data?.next_action?.boleto_display_details?.hosted_voucher_url || null,
            expires_at: row?.metadata?.expires_at || row?.stripe_payment_intent_data?.next_action?.boleto_display_details?.expires_at || null,
            created_at: row.created_at,
        }));
        res.status(200).json({ success: true, items });
    }
    catch (e) {
        console.error('[STRIPE_PENDING] Erro:', e);
        res.status(500).json({ success: false, message: 'Erro interno ao listar pendências' });
    }
});
export default router;
//# sourceMappingURL=stripe.js.map