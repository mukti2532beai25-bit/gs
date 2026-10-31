import { Router, Request, Response } from 'express';
import { processVoiceCommand, applyVoiceCommand, getVoiceHistory } from '../controllers/voiceController.js';
import { getNormalizationHealth } from '../controllers/normalizationController.js';
import { generateExport, getExportHistory } from '../controllers/exportController.js';
import { checkDatabaseConnection } from '../config/database.js';
import { authenticate, requireBusiness } from '../middleware/auth.js';

// Voice router
export const voiceRouter = Router();
voiceRouter.use(authenticate, requireBusiness);
voiceRouter.post('/', processVoiceCommand);
voiceRouter.post('/parse', processVoiceCommand);
voiceRouter.post('/apply', applyVoiceCommand);
voiceRouter.get('/history', getVoiceHistory);

// Normalization router
export const normalizationRouter = Router();
normalizationRouter.use(authenticate, requireBusiness);
normalizationRouter.get('/health', getNormalizationHealth);

// Export router
export const exportRouter = Router();
exportRouter.use(authenticate, requireBusiness);
exportRouter.post('/', generateExport);
exportRouter.get('/history', getExportHistory);

// Health router
export const healthRouter = Router();
healthRouter.get('/', async (_req: Request, res: Response) => {
  const dbStatus = await checkDatabaseConnection();
  res.json({
    status: 'ok',
    service: 'BahiVerse AI Backend Engine',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: {
      provider: dbStatus.provider,
      connected: dbStatus.isConnected,
      details: dbStatus.isConnected ? 'Connected to database' : dbStatus.error,
    },
    aiServices: {
      ocrProvider: process.env.OCR_PROVIDER || 'demo',
      voiceProvider: process.env.VOICE_PROVIDER || 'browser',
    },
  });
});
