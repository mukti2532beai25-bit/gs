import { Router } from 'express';
import { authenticate, requireBusiness } from '../middleware/auth.js';
import {
  listConnectedSources,
  getGmailConnectUrl,
  completeGmailConnection,
  disconnectIntegrationSource,
  triggerSync,
  verifyWhatsAppWebhook,
  receiveWhatsAppWebhook,
} from '../controllers/integrationController.js';

export const integrationRouter = Router();

// Public webhook endpoints for WhatsApp Meta integration
integrationRouter.get('/whatsapp/webhook', verifyWhatsAppWebhook);
integrationRouter.post('/whatsapp/webhook', receiveWhatsAppWebhook);

// Authenticated Business Source Management
integrationRouter.use(authenticate, requireBusiness);
integrationRouter.get('/sources', listConnectedSources);
integrationRouter.get('/gmail/connect', getGmailConnectUrl);
integrationRouter.post('/gmail/callback', completeGmailConnection);
integrationRouter.post('/sources/:type/sync', triggerSync);
integrationRouter.post('/sources/:type/disconnect', disconnectIntegrationSource);
