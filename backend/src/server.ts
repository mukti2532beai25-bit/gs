import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';

// Route groups
import { authRouter } from './routes/authRoutes.js';
import { billRouter } from './routes/billRoutes.js';
import { businessRouter } from './routes/businessRoutes.js';
import { vocabRouter } from './routes/vocabRoutes.js';
import {
  voiceRouter,
  normalizationRouter,
  exportRouter,
  healthRouter,
} from './routes/healthRoutes.js';

export function createServer(): Express {
  const app = express();

  // Security Headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false,
    })
  );

  // CORS
  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  );

  // Body parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Static uploads directory
  const uploadsPath = path.resolve(process.cwd(), env.UPLOAD_DIR);
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsPath));

  // Rate Limiting for Auth Endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { success: false, error: 'Too many authentication attempts. Please retry later.' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // General Rate Limiter
  const generalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 200,
  });

  // Mount Route Groups
  app.use('/api/health', healthRouter);
  app.use('/api/auth', authLimiter, authRouter);
  app.use('/api/bills', generalLimiter, billRouter);
  app.use('/api/business', generalLimiter, businessRouter);
  app.use('/api/vocab', generalLimiter, vocabRouter);
  app.use('/api/voice', generalLimiter, voiceRouter);
  app.use('/api/normalization', generalLimiter, normalizationRouter);
  app.use('/api/export', generalLimiter, exportRouter);

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
}
