/**
 * Optional Authentication Middleware
 * Permite que rotas funcionem com ou sem autenticação
 */

import { getSupabaseServiceClient } from '../../src/lib/supabase-client';

/**
 * Middleware de autenticação opcional
 * Extrai informações do usuário se o token estiver presente, mas não falha se não estiver
 */
export const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Sem token - continua sem usuário
      req.user = null;
      return next();
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      req.user = null;
      return next();
    }
    
    // Tentar validar o token
    const supabase = getSupabaseServiceClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.log('[OPTIONAL_AUTH] Token inválido ou expirado:', error?.message);
      req.user = null;
    } else {
      console.log('[OPTIONAL_AUTH] Usuário autenticado:', user.id);
      req.user = user;
    }
    
    next();
    
  } catch (error) {
    console.error('[OPTIONAL_AUTH] Erro no middleware:', error);
    // Em caso de erro, continua sem usuário
    req.user = null;
    next();
  }
};

export default optionalAuthMiddleware;