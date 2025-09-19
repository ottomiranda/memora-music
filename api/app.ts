/**
 * This is a API server
 */

import express, { type Request, type Response, type NextFunction }  from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import generatePreviewRoutes from './routes/generate-preview.js';
import checkMusicStatusRoutes from './routes/check-music-status.js';
import saveFeedbackRoutes from './routes/save-feedback.js';
import paywallRoutes from './routes/paywall.js';
import stripeRoutes from './routes/stripe.js';
import supabasePublicRoutes from './routes/supabase-public.js';
import sunoCoverCallbackRoute from './routes/suno-cover-callback.js';
import sunoMusicRoute from './routes/suno-music.js';

// for esm mode
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// load env
dotenv.config({ path: path.join(__dirname, '../.env') });


const app: express.Application = express();

// ==================== TESTE NUCLEAR (TEMPORÁRIO) ====================
// Comentando toda a lógica de corsOptions para diagnóstico
/*
const allowedOrigins = [
  'http://localhost:5173' // Corrigido para a porta 5173
];

if (process.env.FRONTEND_URL) {
  console.log(`Variável FRONTEND_URL encontrada: ${process.env.FRONTEND_URL}`);
  allowedOrigins.push(process.env.FRONTEND_URL);
} else {
  console.warn('AVISO: Variável de ambiente FRONTEND_URL não foi encontrada.');
}

if (process.env.RENDER_EXTERNAL_URL) {
  allowedOrigins.push(process.env.RENDER_EXTERNAL_URL);
}

console.log('✅ Origens CORS permitidas para este ambiente:', allowedOrigins);

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.error(`❌ CORS: Bloqueando origin não autorizado: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};
*/

// TESTE NUCLEAR: CORS totalmente aberto para diagnóstico
console.log('🚨 TESTE NUCLEAR: CORS totalmente aberto ativado!');
app.use(cors());

// =================================================================

// Raw body parsing for Stripe webhook, JSON for everything else
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * Serve static files from React build
 */
const staticFilesPath = path.join(__dirname, '..', '..', 'dist');
app.use(express.static(staticFilesPath));

/**
 * API Routes
 */
app.use('/api/auth', authRoutes);
app.use('/api/generate-preview', generatePreviewRoutes);
app.use('/api/check-music-status', checkMusicStatusRoutes);
app.use('/api/save-feedback', saveFeedbackRoutes);
app.use('/api/user', paywallRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/supabase', supabasePublicRoutes);
app.use('/api/suno-cover-callback', sunoCoverCallbackRoute);
app.use('/api/suno', sunoMusicRoute);

/**
 * health
 */
app.use('/api/health', (req: Request, res: Response, next: NextFunction): void => {
  res.status(200).json({
    success: true,
    message: 'ok'
  });
});

/**
 * Catch-all handler: serve React app for non-API routes
 */
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(staticFilesPath, 'index.html'));
});

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error'
  });
});

export default app;
