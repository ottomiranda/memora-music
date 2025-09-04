/**
 * Paywall API routes
 * Handle user creation status, mock payments, and paywall protection
 */
import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import Stripe from 'stripe';
import jwt from 'jsonwebtoken';
import { executeSupabaseQuery, getSupabaseServiceClient } from '../../src/lib/supabase-client.js';

const router = Router();

// Função para obter cliente Supabase sob demanda (compatibilidade)
const getSupabaseClient = () => {
  return getSupabaseServiceClient();
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
 */
router.get('/creation-status', async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('[DEBUG] Rota /creation-status atingida');
    
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
    
    console.log('[DEBUG] Verificando status para userId:', userId);
    
    // Buscar dados do usuário no banco
    const supabase = getSupabaseClient();
    const { data: user, error } = await supabase
      .from('users')
      .select('freesongsused')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('[ERROR] Erro ao buscar usuário:', error);
      // Se usuário não existe, assumir que é novo (0 músicas usadas)
      const freeSongsUsed = 0;
      const isFree = freeSongsUsed < 1;
      
      res.status(200).json({
        success: true,
        isFree,
        freeSongsUsed,
        message: isFree ? 'Próxima música é gratuita' : 'Próxima música será paga'
      });
      return;
    }
    
    const freeSongsUsed = user.freesongsused || 0;
    const isFree = freeSongsUsed < 1;
    
    console.log('[DEBUG] Status do usuário:', { freeSongsUsed, isFree });
    
    res.status(200).json({
      success: true,
      isFree,
      freeSongsUsed,
      message: isFree ? 'Próxima música é gratuita' : 'Próxima música será paga'
    });
    
  } catch (error) {
    console.error('[ERROR] Erro na rota /creation-status:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
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