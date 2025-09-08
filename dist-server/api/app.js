/**
 * This is a API server
 */
import express from 'express';
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
// for esm mode
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// load env
dotenv.config({ path: path.join(__dirname, '../.env') });
const app = express();
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://localhost:3000'
    ],
    credentials: true
}));
// Raw body parsing for Stripe webhook, JSON for everything else
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
/**
 * API Routes
 */
app.use('/api/auth', authRoutes);
app.use('/api/generate-preview', generatePreviewRoutes);
app.use('/api/check-music-status', checkMusicStatusRoutes);
app.use('/api/save-feedback', saveFeedbackRoutes);
app.use('/api/user', paywallRoutes);
app.use('/api/stripe', stripeRoutes);
/**
 * health
 */
app.use('/api/health', (req, res, next) => {
    res.status(200).json({
        success: true,
        message: 'ok'
    });
});
/**
 * error handler middleware
 */
app.use((error, req, res, next) => {
    res.status(500).json({
        success: false,
        error: 'Server internal error'
    });
});
/**
 * 404 handler
 */
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'API not found'
    });
});
export default app;
//# sourceMappingURL=app.js.map