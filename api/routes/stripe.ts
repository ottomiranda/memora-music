/**
 * Stripe Payment API routes
 * Handle payment intents, confirmations, and webhooks
 */
import * as express from 'express';
import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import Stripe from 'stripe';
import { executeSupabaseQuery, getSupabaseServiceClient } from '../../src/lib/supabase-client.js';
import { optionalAuthMiddleware } from '../middleware/optionalAuth.js';
import rateLimit from 'express-rate-limit';

const router = Router();

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

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
  amount: z.number().min(100, 'Valor mínimo é R$ 1,00').max(100000, 'Valor máximo é R$ 1.000,00'),
  currency: z.string().default('brl'),
  metadata: z.object({
    userId: z.string().optional(),
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
const extractUserIdFromToken = async (jwt: string): Promise<string | null> => {
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
  } catch (authError) {
    console.error('[STRIPE_AUTH_EXCEPTION] Exceção ao validar token:', authError);
    return null;
  }
};

/**
 * Create Payment Intent
 * POST /api/stripe/create-payment-intent
 */
router.post('/create-payment-intent', paymentRateLimit, optionalAuthMiddleware, async (req: Request, res: Response): Promise<void> => {
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
    let userId: string | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      userId = await extractUserIdFromToken(token);
    }
    
    // Criar Payment Intent no Stripe
    console.log("=============================================");
    console.log("[DEBUG] Chave Secreta usada pelo Backend:", process.env.STRIPE_SECRET_KEY);
    console.log("=============================================");
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Stripe espera valor em centavos
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: userId || 'guest',
        productType: metadata?.productType || 'music_generation',
        description: metadata?.description || 'Geração de música premium',
        timestamp: new Date().toISOString()
      }
    });
    
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
    
  } catch (error) {
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
router.post('/confirm-payment', paymentRateLimit, optionalAuthMiddleware, async (req: Request, res: Response): Promise<void> => {
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
    
  } catch (error) {
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
router.post('/webhook', webhookRateLimit, async (req: Request, res: Response): Promise<void> => {
  try {
    const sig = req.headers['stripe-signature'] as string;
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
    
    let event: Stripe.Event;
    
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error('[STRIPE_WEBHOOK] Erro de verificação de assinatura:', err);
      res.status(400).json({ success: false, message: 'Assinatura inválida' });
      return;
    }
    
    console.log('[STRIPE_WEBHOOK] Evento recebido:', event.type, event.id);
    
    // Processar eventos do Stripe
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSuccess(paymentIntent);
        break;
        
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailure(failedPayment);
        break;
        
      default:
        console.log('[STRIPE_WEBHOOK] Evento não tratado:', event.type);
    }
    
    res.status(200).json({ success: true, received: true });
    
  } catch (error) {
    console.error('[STRIPE_WEBHOOK_ERROR] Erro no webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor no webhook'
    });
  }
});

// Função para tratar pagamento bem-sucedido
async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent): Promise<void> {
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
        .from('users')
        .update({ freesongsused: 0 })
        .eq('id', userId);
      
      if (resetError) {
        console.error('[STRIPE_WEBHOOK] Erro ao resetar contador de músicas:', resetError);
      } else {
        console.log('[STRIPE_WEBHOOK] Contador de músicas resetado para usuário:', userId);
      }
    } else {
      // Caso convidado: usar deviceId na metadata para resetar contador
      const deviceId = (paymentIntent.metadata?.deviceId || paymentIntent.metadata?.device_id) as string | undefined;
      if (deviceId) {
        const { error: resetGuestError } = await supabase
          .from('users')
          .update({ freesongsused: 0 })
          .eq('device_id', deviceId);

        if (resetGuestError) {
          console.error('[STRIPE_WEBHOOK] Erro ao resetar contador (guest por device_id):', resetGuestError);
        } else {
          console.log('[STRIPE_WEBHOOK] Contador resetado para guest com device_id:', deviceId);
        }
      } else {
        console.warn('[STRIPE_WEBHOOK] Pagamento sem userId e sem deviceId na metadata. Nenhum reset aplicado.');
      }
    }
    
    console.log('[STRIPE_WEBHOOK] Pagamento processado com sucesso:', paymentIntent.id);
    
  } catch (error) {
    console.error('[STRIPE_WEBHOOK] Erro ao processar pagamento bem-sucedido:', error);
  }
}

// Função para tratar pagamento falhado
async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent): Promise<void> {
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
    
  } catch (error) {
    console.error('[STRIPE_WEBHOOK] Erro ao processar pagamento falhado:', error);
  }
}

export default router;
