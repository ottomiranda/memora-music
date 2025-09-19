import { getSupabaseServiceClient } from '../../src/lib/supabase-client.js';
// Função auxiliar para extrair userId do token usando Supabase Auth
const extractUserIdFromToken = async (jwt) => {
    try {
        const supabase = getSupabaseServiceClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
        if (userError) {
            console.log('[OPTIONAL_AUTH] Token inválido ou expirado:', userError.message);
            return null;
        }
        if (user) {
            console.log('[OPTIONAL_AUTH] Usuário autenticado com UUID:', user.id);
            return {
                id: user.id,
                email: user.email,
                name: user.user_metadata?.name
            };
        }
        return null;
    }
    catch (authError) {
        console.log('[OPTIONAL_AUTH] Exceção ao validar token:', authError);
        return null;
    }
};
/**
 * Optional Authentication Middleware
 * - If token is present and valid, sets req.user
 * - If token is missing or invalid, continues without setting req.user
 * - Never blocks the request with 401 error
 */
export const optionalAuthMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        // Se não há header de autorização, continuar sem usuário
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('[OPTIONAL_AUTH] Nenhum token fornecido - continuando como convidado');
            next();
            return;
        }
        const token = authHeader.split(' ')[1];
        // Se não há token após 'Bearer ', continuar sem usuário
        if (!token) {
            console.log('[OPTIONAL_AUTH] Token vazio - continuando como convidado');
            next();
            return;
        }
        // Tentar extrair dados do usuário do token
        const userData = await extractUserIdFromToken(token);
        if (userData) {
            // Token válido - definir req.user
            req.user = userData;
            console.log('[OPTIONAL_AUTH] Usuário autenticado:', userData.id);
        }
        else {
            // Token inválido - continuar sem usuário
            console.log('[OPTIONAL_AUTH] Token inválido - continuando como convidado');
        }
        next();
    }
    catch (error) {
        // Em caso de erro, continuar sem usuário (não bloquear)
        console.error('[OPTIONAL_AUTH] Erro no middleware opcional:', error);
        next();
    }
};
export default optionalAuthMiddleware;
//# sourceMappingURL=optionalAuth.js.map