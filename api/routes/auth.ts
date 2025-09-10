/**
 * This is a user authentication API route demo.
 * Handle user registration, login, token management, etc.
 */
import { Router, type Request, type Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Função auxiliar para gerar token simulado
const generateToken = (): string => {
  return `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Função auxiliar para validar email
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * User Registration (Signup)
 * POST /api/auth/signup
 */
router.post('/signup', async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('[DEBUG] Rota /signup atingida. req.body:', req.body);
    
    const { email, password, name } = req.body;
    
    // Validação básica dos campos obrigatórios
    if (!email || !password) {
      console.log('[DEBUG] Campos obrigatórios ausentes:', { email: !!email, password: !!password });
      res.status(400).json({
        success: false,
        message: 'Email e senha são obrigatórios'
      });
      return;
    }
    
    // Validação do formato do email
    if (!isValidEmail(email)) {
      console.log('[DEBUG] Email inválido:', email);
      res.status(400).json({
        success: false,
        message: 'Formato de email inválido'
      });
      return;
    }
    
    // Validação da senha (mínimo 6 caracteres)
    if (password.length < 6) {
      console.log('[DEBUG] Senha muito curta:', password.length);
      res.status(400).json({
        success: false,
        message: 'Senha deve ter pelo menos 6 caracteres'
      });
      return;
    }
    
    // Simular verificação se usuário já existe
    // TODO: Implementar verificação real no banco de dados
    console.log('[DEBUG] Criando novo usuário:', { email, name });
    
    // Simular criação do usuário
    const newUser = {
      id: uuidv4(),
      email,
      name: name || email.split('@')[0]
    };
    
    const token = generateToken();
    
    console.log('[DEBUG] Usuário criado com sucesso:', { user: newUser, token });
    
    res.status(201).json({
      success: true,
      message: 'Conta criada com sucesso',
      user: newUser,
      token
    });
    
  } catch (error) {
    console.error('[ERROR] Erro na rota /signup:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * User Registration (Register - alias para signup)
 * POST /api/auth/register
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  console.log('[DEBUG] Rota /register redirecionando para lógica de /signup');
  // Reutilizar a mesma lógica do /signup
  try {
    console.log('[DEBUG] Rota /register atingida. req.body:', req.body);
    
    const { email, password, name } = req.body;
    
    // Validação básica dos campos obrigatórios
    if (!email || !password) {
      console.log('[DEBUG] Campos obrigatórios ausentes:', { email: !!email, password: !!password });
      res.status(400).json({
        success: false,
        message: 'Email e senha são obrigatórios'
      });
      return;
    }
    
    // Validação do formato do email
    if (!isValidEmail(email)) {
      console.log('[DEBUG] Email inválido:', email);
      res.status(400).json({
        success: false,
        message: 'Formato de email inválido'
      });
      return;
    }
    
    // Validação da senha (mínimo 6 caracteres)
    if (password.length < 6) {
      console.log('[DEBUG] Senha muito curta:', password.length);
      res.status(400).json({
        success: false,
        message: 'Senha deve ter pelo menos 6 caracteres'
      });
      return;
    }
    
    // Simular criação do usuário
    const newUser = {
      id: `user_${Date.now()}`,
      email,
      name: name || email.split('@')[0]
    };
    
    const token = generateToken();
    
    console.log('[DEBUG] Usuário criado com sucesso via /register:', { user: newUser, token });
    
    res.status(201).json({
      success: true,
      message: 'Conta criada com sucesso',
      user: newUser,
      token
    });
    
  } catch (error) {
    console.error('[ERROR] Erro na rota /register:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * User Login
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('[DEBUG] Rota /login atingida. req.body:', req.body);
    
    const { email, password } = req.body;
    
    // Validação básica dos campos obrigatórios
    if (!email || !password) {
      console.log('[DEBUG] Campos obrigatórios ausentes:', { email: !!email, password: !!password });
      res.status(400).json({
        success: false,
        message: 'Email e senha são obrigatórios'
      });
      return;
    }
    
    // Validação do formato do email
    if (!isValidEmail(email)) {
      console.log('[DEBUG] Email inválido:', email);
      res.status(400).json({
        success: false,
        message: 'Formato de email inválido'
      });
      return;
    }
    
    // Simular verificação de credenciais
    // TODO: Implementar verificação real no banco de dados
    console.log('[DEBUG] Verificando credenciais:', { email });
    
    // Simular usuário encontrado
    const user = {
      id: uuidv4(),
      email,
      name: email.split('@')[0]
    };
    
    const token = generateToken();
    
    console.log('[DEBUG] Login realizado com sucesso:', { user, token });
    
    res.status(200).json({
      success: true,
      message: 'Login realizado com sucesso',
      user,
      token
    });
    
  } catch (error) {
    console.error('[ERROR] Erro na rota /login:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * User Logout
 * POST /api/auth/logout
 */
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('[DEBUG] Rota /logout atingida. req.body:', req.body);
    
    // TODO: Implementar invalidação de token no banco de dados
    console.log('[DEBUG] Logout realizado com sucesso');
    
    res.status(200).json({
      success: true,
      message: 'Logout realizado com sucesso'
    });
    
  } catch (error) {
    console.error('[ERROR] Erro na rota /logout:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

export default router;
