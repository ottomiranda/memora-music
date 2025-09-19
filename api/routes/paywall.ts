/**
 * Paywall API routes
 * Handle user creation status, mock payments, and paywall protection
 */
import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import Stripe from 'stripe';
import jwt from 'jsonwebtoken';
import { executeSupabaseQuery, getSupabaseServiceClient } from '../../src/lib/supabase-client.js';
import { optionalAuthMiddleware } from '../middleware/optionalAuth.js';
import type { PostgrestError } from '@supabase/supabase-js';

const router = Router();

// Função para obter cliente Supabase sob demanda (compatibilidade)
const getSupabaseClient = () => {
  return getSupabaseServiceClient();
};

// Métricas em memória para monitorar fallback por IP
type IpFallbackMetrics = {
  totalAttempts: number;
  totalHits: number;
  byDay: Record<string, { attempts: number; hits: number }>; // yyyy-mm-dd
  byTtlDays: Record<string, { attempts: number; hits: number }>;
};

const ipFallbackMetrics: IpFallbackMetrics = {
  totalAttempts: 0,
  totalHits: 0,
  byDay: {},
  byTtlDays: {},
};

const recordIpFallback = (used: boolean, ttlDays: number) => {
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
  } catch (e) {
    // Não quebrar o fluxo por causa de métricas
  }
};

// Função auxiliar para extrair userId do token usando Supabase Auth
const extractUserIdFromToken = async (jwt: string): Promise<string | null> => {
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
  } catch (authError) {
    console.error('[AUTH_EXCEPTION] Exceção ao validar token:', authError);
    return null;
  }
};

// Função auxiliar para gerar ID de transação simulada
const generateTransactionId = (): string => {
  return `mock_txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get User Creation Status
 * GET /api/user/creation-status
 * Public route - works for both authenticated and guest users
 * Robust implementation with fallback logic for guest users
 */
router.get('/creation-status', optionalAuthMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('[DEBUG] Rota /creation-status atingida');
    
    // Extrair userId de forma segura usando optional chaining
    const requestWithUser = req as Request & { user?: { id?: string } };
    const userId = requestWithUser.user?.id;
    const deviceId = req.headers['x-device-id'] as string | undefined;
    const guestId = req.headers['x-guest-id'] as string | undefined;
    const clientIp = req.ip;
    
    console.log('[DEBUG] Dados de identificação:', { userId, deviceId, clientIp });
    
    const supabase = getSupabaseClient();
    let foundUser: { freesongsused?: number } | null = null;
    let findError: PostgrestError | null = null;

    // 1) Usuário autenticado
    if (userId) {
      console.log('[DEBUG] Verificando status para usuário autenticado (prioridade 1):', userId);
      // Buscar contagem de criações do usuário na tabela user_creations
      const { data, error } = await supabase
        .from('user_creations')
        .select('freesongsused, device_id')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (data) {
        const currentFree = data.freesongsused || 0;
        foundUser = { freesongsused: currentFree };
        // Se existir um deviceId atual diferente, combinar contadores
        const candidateDeviceId = deviceId || data.device_id || null;
        if (candidateDeviceId && (!deviceId || candidateDeviceId !== deviceId)) {
          const { data: mergeRow, error: mergeError } = await supabase
            .from('user_creations')
            .select('freesongsused')
            .eq('device_id', candidateDeviceId)
            .maybeSingle();
          if (!mergeError && mergeRow) {
            foundUser.freesongsused = Math.max(foundUser.freesongsused, mergeRow.freesongsused || 0);
          }
        }
      } else {
        foundUser = null;
      }
      // DEBUG: Log detalhado para diagnóstico em produção
      console.log('[PAYWALL_DEBUG] Supabase config check:', {
        hasUrl: !!process.env.SUPABASE_URL,
        hasKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        urlLength: process.env.SUPABASE_URL?.length || 0,
        keyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0
      });

      // Só considerar erro se não for "nenhum resultado encontrado"
      if (error && error.code !== 'PGRST116') {
        console.error('[PAYWALL_ERROR] Erro ao buscar usuário por deviceId:', JSON.stringify(error, null, 2));
        findError = error;
      }
    }

    // 2) Se não autenticado ou não encontrado, tentar pelo deviceId
    if (deviceId) {
      console.log('[DEBUG] Usuário convidado - buscando por deviceId (prioridade 2):', deviceId);
      const { data, error } = await supabase
        .from('user_creations')
        .select('freesongsused')
        .eq('device_id', deviceId)
        .maybeSingle();
      
      if (data) {
        const freeCount = data.freesongsused || 0;
        if (foundUser) {
          foundUser.freesongsused = Math.max(foundUser.freesongsused || 0, freeCount);
        } else {
          foundUser = { freesongsused: freeCount };
        }
      }
      // Só considerar erro se não for "nenhum resultado encontrado"
      if (error && error.code !== 'PGRST116') {
        findError = error;
      }
    }

    // 2.5) Fallback dedicado para guests identificados apenas por guestId
    if (guestId) {
      console.log('[DEBUG] Usuário convidado - fallback por guestId (prioridade 2.5):', guestId);
      const { data, error } = await supabase
        .from('user_creations')
        .select('freesongsused')
        .eq('device_id', guestId)
        .maybeSingle();

      if (data) {
        const freeCount = data.freesongsused || 0;
        if (foundUser) {
          foundUser.freesongsused = Math.max(foundUser.freesongsused || 0, freeCount);
        } else {
          foundUser = { freesongsused: freeCount };
        }
      }
      // Só considerar erro se não for "nenhum resultado encontrado"
      if (error && error.code !== 'PGRST116') {
        console.error('[PAYWALL_ERROR] Erro ao buscar usuário por guestId:', JSON.stringify(error, null, 2));
        findError = error;
      }
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
        .is('user_id', null)
        .gte('created_at', cutoff)
        .order('created_at', { ascending: false })
        .maybeSingle();
      
      // Registrar métrica (attempt e se houve hit)
      recordIpFallback(!!data, ttlDays);
      if (data) {
        foundUser = { freesongsused: data.freesongsused || 0 };
      }
      // Só considerar erro se não for "nenhum resultado encontrado"
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
      // Se NENHUM usuário foi encontrado com os critérios, é um novo convidado
      console.log('[DEBUG] Nenhum usuário encontrado - novo convidado');
      res.status(200).json({
        success: true,
        isFree: true,
        freeSongsUsed: 0,
        message: 'Primeira música é gratuita para convidados',
        userType: userId ? 'new_authenticated' : (deviceId ? 'new_guest_device' : 'new_guest_ip')
      });
      return;
    }
    
    // Se um usuário foi encontrado, verifique sua cota
    const FREE_SONG_LIMIT = 1;
    const freeSongsUsed = foundUser.freesongsused || 0;
    const isFree = freeSongsUsed < FREE_SONG_LIMIT; // Usuário é bloqueado quando freeSongsUsed >= FREE_SONG_LIMIT
    
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
    
  } catch (error) {
    console.error('[ERROR] Erro na rota /creation-status:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Endpoint auxiliar para consultar métricas de fallback por IP (uso interno/diagnóstico)
router.get('/creation-status/metrics', (req: Request, res: Response): void => {
  res.status(200).json({ success: true, metrics: ipFallbackMetrics });
});

/**
 * Confirm Mock Payment
 * POST /api/confirm-mock-payment
 */
router.post('/confirm-mock-payment', async (req: Request, res: Response): Promise<void> => {
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
    
  } catch (error) {
    console.error('[ERROR] Erro na rota /confirm-mock-payment:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

export default router;
