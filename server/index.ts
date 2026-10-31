import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import rateLimit from 'express-rate-limit';
import { prisma } from './db.js';
import authRoutes from './routes/authRoutes.js';
import billRoutes from './routes/billRoutes.js';
import businessRoutes from './routes/businessRoutes.js';
import vocabRoutes from './routes/vocabRoutes.js';
import exportRoutes from './routes/exportRoutes.js';

const app = express();
const PORT = process.env.PORT || 3001;
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.NODE_ENV === 'production' ? false : '*' }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
app.use('/uploads', express.static(path.resolve(UPLOAD_DIR)));

// Rate limiting — auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: 'Too many requests. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting — general API
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200,
  message: { error: 'Rate limit exceeded. Please slow down.' },
});

// Request logger (no bill content to protect privacy)
app.use((req: Request, _res: Response, next: NextFunction) => {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${req.method} ${req.path}`);
  next();
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/bills', apiLimiter, billRoutes);
app.use('/api/business', apiLimiter, businessRoutes);
app.use('/api/vocab', apiLimiter, vocabRoutes);
app.use('/api/export', apiLimiter, exportRoutes);

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'BahiVerse AI API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    demoMode: process.env.OCR_PROVIDER === 'demo' || !process.env.OCR_PROVIDER,
  });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[server/error]', err?.message || err);
  const status = err?.status || err?.statusCode || 500;
  res.status(status).json({ error: err?.message || 'Internal server error' });
});

// ── Serve static frontend in production ──────────────────────────────────────
const distPath = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// ── Boot ──────────────────────────────────────────────────────────────────────
async function bootstrap() {
  await prisma.$connect();
  console.log('✅ Database connected');

  app.listen(PORT, () => {
    console.log(`\n🚀 BahiVerse AI API running on http://localhost:${PORT}`);
    console.log(`🔗 Health: http://localhost:${PORT}/api/health`);
    console.log(`🗄️  OCR mode: ${process.env.OCR_PROVIDER || 'demo'}`);
    console.log(`📁 Uploads: ./${UPLOAD_DIR}/\n`);
  });
}

bootstrap().catch((err) => {
  console.error('❌ Fatal startup error:', err);
  process.exit(1);
});
