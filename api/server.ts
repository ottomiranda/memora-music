import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Obter __dirname equivalente para módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Importar rotas
import generatePreviewRoute from './routes/generate-preview.js';
import authRoute from './routes/auth.js';
import checkMusicStatusRoute from './routes/check-music-status.js';
import saveFeedbackRoute from './routes/save-feedback.js';

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
const PORT = process.env.PORT || 3001;

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
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

// --- FIM DA SOLUÇÃO DEFINITIVA DE CORS ---

// Configurar CORS com a nova lógica dinâmica
app.use(cors(corsOptions));

// Middleware para parsing de JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Configurar rotas
app.use('/api/health', healthRoute);
app.use('/api/generate-preview', generatePreviewRoute);
app.use('/api/auth', authRoute);
app.use('/api/check-music-status', checkMusicStatusRoute);
app.use('/api/save-feedback', saveFeedbackRoute);

console.log('📋 Rotas registradas:');
console.log('  - /api/health');
console.log('  - /api/generate-preview');
console.log('  - /api/auth');
console.log('  - /api/check-music-status');
console.log('  - /api/save-feedback');

// Rota de teste simples
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API funcionando!', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
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

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      message: `Rota ${req.originalUrl} não encontrada`,
      status: 404,
      timestamp: new Date().toISOString()
    }
  });
});

// Inicializar servidor na porta fixa para ambiente estável
app.listen(PORT, () => {
  console.log(`🚀 Servidor back-end rodando de forma estável na porta ${PORT}`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⏰ Iniciado em: ${new Date().toISOString()}`);
  console.log(`✅ Ambiente de desenvolvimento estabilizado - porta fixa configurada`);
}).on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Erro: Porta ${PORT} já está em uso.`);
    console.error(`💡 Solução: Pare o processo que está usando a porta ${PORT} ou altere a variável PORT no arquivo .env`);
    console.error(`🔍 Para encontrar o processo: lsof -ti:${PORT}`);
  } else {
    console.error('❌ Erro ao iniciar servidor:', err);
  }
  process.exit(1);
});

// Tratamento de sinais de encerramento
process.on('SIGTERM', () => {
  console.log('🛑 Recebido SIGTERM, encerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Recebido SIGINT, encerrando servidor...');
  process.exit(0);
});

export default app;