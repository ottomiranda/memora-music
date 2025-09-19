/**
 * Required Authentication Middleware
 * - Blocks requests without valid authentication token
 * - Returns 401 error if token is missing or invalid
 * - Sets req.user with authenticated user data
 */
import { createClient } from '@supabase/supabase-js';
// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);
/**
 * Required Authentication Middleware
 * Blocks access if user is not authenticated
 */
export const requireAuthMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        // Check if authorization header exists
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('[REQUIRE_AUTH] Token de acesso requerido');
            res.status(401).json({
                success: false,
                error: 'Token de acesso requerido',
                message: 'Você precisa estar logado para acessar este recurso'
            });
            return;
        }
        const token = authHeader.split(' ')[1];
        // Check if token exists after 'Bearer '
        if (!token) {
            console.log('[REQUIRE_AUTH] Token vazio');
            res.status(401).json({
                success: false,
                error: 'Token inválido',
                message: 'Token de acesso inválido'
            });
            return;
        }
        // Verify token with Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) {
            console.log('[REQUIRE_AUTH] Token inválido ou expirado:', error?.message);
            res.status(401).json({
                success: false,
                error: 'Token inválido ou expirado',
                message: 'Sua sessão expirou. Faça login novamente.'
            });
            return;
        }
        // Set authenticated user in request
        req.user = {
            id: user.id,
            email: user.email || '',
            aud: user.aud,
            role: user.role || 'authenticated'
        };
        console.log('[REQUIRE_AUTH] Usuário autenticado:', {
            id: user.id,
            email: user.email
        });
        next();
    }
    catch (error) {
        console.error('[REQUIRE_AUTH] Erro na verificação de autenticação:', error);
        res.status(401).json({
            success: false,
            error: 'Erro de autenticação',
            message: 'Erro interno de autenticação'
        });
    }
};
export default requireAuthMiddleware;
//# sourceMappingURL=requireAuth.js.map