import http from "http";
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Define o caminho raiz do projeto de forma robusta
// Usa a variável de ambiente da Render se disponível, senão, usa /app como padrão.
const projectRoot = process.env.RENDER_ROOT || '/app';

// Carrega as variáveis de ambiente a partir da raiz do projeto
dotenv.config({ path: path.join(projectRoot, '.env') });

// Importar rotas
import generatePreviewRoute from './routes/generate-preview.js';
import authRoute from './routes/auth.js';
import checkMusicStatusRoute from './routes/check-music-status.js';
import saveFeedbackRoute from './routes/save-feedback.js';
import songsRoute from './routes/songs.js';
import migrateGuestDataRoute from './routes/migrate-guest-data.js';
import paywallRoute from './routes/paywall.js';
import downloadRoute from './routes/download.js';
import stripeRoute from './routes/stripe.js';

// Criar rota de health check como Express Router
import { Router } from 'express';
const healthRoute = Router();

healthRoute.get('/', (req, res) => {
  try {
    // Verificar variáveis de ambiente críticas
    const envChecks = {
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
      SUNO_API_KEY: !!process.env.SUNO_API_KEY,
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY
    };

    const allEnvVarsPresent = Object.values(envChecks).every(Boolean);

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
      all_env_vars_present: allEnvVarsPresent
    };

    console.log('✅ Health check concluído:', {
      status: healthData.status,
      env_vars_ok: allEnvVarsPresent,
      memory_used: `${healthData.memory.used}MB`
    });

    return res.status(200).json(healthData);

  } catch (error) {
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
});

const app = express();

// Configurar trust proxy para identificar IP do cliente corretamente
// Necessário para req.ip funcionar com proxies (Vercel, Heroku, etc.)
app.set('trust proxy', true);
console.log('🔒 Trust proxy configurado para extração de IP do cliente');

// Inicializar mapa global de tarefas de música
if (!global.musicTasks) {
  global.musicTasks = new Map();
  console.log('🎵 Mapa global de tarefas de música inicializado');
}

// --- INÍCIO DA SOLUÇÃO DEFINITIVA DE CORS ---

// 1. Defina a URL de produção a partir das variáveis de ambiente
const productionOrigin = process.env.FRONTEND_PROD_URL;

// 2. Crie a configuração dinâmica do CORS
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Permite requisições sem 'origin' (como apps mobile ou Postman)
    if (!origin) {
      return callback(null, true);
    }
    
    // Em desenvolvimento, permite qualquer localhost
    if (process.env.NODE_ENV === 'development' && origin.startsWith('http://localhost:')) {
      console.log(`✅ CORS: Permitindo origin de desenvolvimento: ${origin}`);
      return callback(null, true);
    }
    
    // Em produção, permite apenas a URL oficial
    if (process.env.NODE_ENV === 'production' && origin === productionOrigin) {
      console.log(`✅ CORS: Permitindo origin de produção: ${origin}`);
      return callback(null, true);
    }

    // Bloqueia todos os outros
    console.log(`❌ CORS: Bloqueando origin não autorizado: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-guest-id', 'X-Device-ID'],
  optionsSuccessStatus: 200
};

// --- FIM DA SOLUÇÃO DEFINITIVA DE CORS ---

// Configurar CORS com a nova lógica dinâmica
app.use(cors(corsOptions));

// Middleware específico para webhook do Stripe (deve vir ANTES do express.json)
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

// Middleware para parsing de JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Servir arquivos estáticos do frontend
// Define o caminho para a pasta 'dist' a partir da raiz do projeto
const staticFilesPath = path.join(projectRoot, 'dist');
app.use(express.static(staticFilesPath));

// Configurar rotas
app.use('/api/health', healthRoute);
app.use('/api/generate-preview', generatePreviewRoute);
app.use('/api/auth', authRoute);
app.use('/api/check-music-status', checkMusicStatusRoute);
app.use('/api/save-feedback', saveFeedbackRoute);
app.use('/api/songs', songsRoute);
app.use('/api/migrate-guest-data', migrateGuestDataRoute);
app.use('/api/user', paywallRoute);
app.use('/api/download', downloadRoute);
app.use('/api/stripe', stripeRoute);

console.log('📋 Rotas registradas:');
console.log('  - /api/health');
console.log('  - /api/generate-preview');
console.log('  - /api/auth');
console.log('  - /api/check-music-status');
console.log('  - /api/save-feedback');
console.log('  - /api/songs');
console.log('  - /api/migrate-guest-data');
console.log('  - /api/user (paywall)');
console.log('  - /api/download');
console.log('  - /api/stripe');
console.log('🔄 Sistema de salvamento automático ativo');

// Rota de teste simples
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API funcionando!', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Rota catch-all: serve o index.html para rotas não-API
app.get('*', (req, res) => {
  // Verifique se a requisição não é para a API antes de servir o index.html
  if (!req.originalUrl.startsWith('/api')) {
    res.sendFile(path.join(staticFilesPath, 'index.html'));
  } else {
    // Se for uma rota de API não encontrada, você pode querer um 404 de API
    res.status(404).json({ error: 'API route not found' });
  }
});

// Middleware de tratamento de erros global
app.use((err: Error & { status?: number }, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Erro no servidor:', err);
  
  // Se já foi enviada uma resposta, delegar para o handler padrão do Express
  if (res.headersSent) {
    return next(err);
  }
  
  // Resposta de erro padronizada
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Erro interno do servidor',
      status: err.status || 500,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

const port = Number(process.env.PORT) || 3337;

declare global { var __memoraServerStarted: boolean | undefined; }
if (!global.__memoraServerStarted) {
  global.__memoraServerStarted = true;
  const server = app.listen(port, () => {
    console.log(`🚀 Backend rodando em http://localhost:${port}`);
  });

  server.on("error", (err: Error & { code?: string }) => {
    if (err?.code === "EADDRINUSE") {
      console.error(`❌ Porta ${port} em uso. Saindo com código 1.`);
      process.exit(1);
    }
    throw err;
  });

  function shutdown(sig: string) {
    console.log(`📴 Recebido ${sig}. Encerrando servidor...`);
    server.close(() => process.exit(0));
  }
  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
} else {
  console.log("⚠️ Servidor já iniciado. Ignorando novo listen.");
}

export default app;