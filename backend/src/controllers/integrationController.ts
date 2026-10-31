import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import {
  getSources,
  getGmailAuthUrl,
  handleGmailCallback,
  disconnectSource,
  triggerSourceSync,
  handleWhatsAppWebhook,
} from '../services/integrations/integrationService.js';

/**
 * Lists connected document sources.
 */
export async function listConnectedSources(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const businessId = req.user!.businessId!;
    const sources = await getSources(businessId);
    res.json({ success: true, data: sources });
  } catch (error) {
    next(error);
  }
}

/**
 * Returns the OAuth2 connection URL for Gmail.
 */
export async function getGmailConnectUrl(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const businessId = req.user!.businessId!;
    const result = await getGmailAuthUrl(businessId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * Handles Gmail OAuth2 callback.
 */
export async function completeGmailConnection(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const businessId = req.user!.businessId!;
    const { code } = req.body;
    const connected = await handleGmailCallback(businessId, code || 'demo-code');
    res.json({ success: true, data: connected });
  } catch (error) {
    next(error);
  }
}

/**
 * Disconnects an integration source.
 */
export async function disconnectIntegrationSource(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const businessId = req.user!.businessId!;
    const { type } = req.params;
    const updated = await disconnectSource(businessId, type as any);
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
}

/**
 * Manually triggers a sync on a connected source.
 */
export async function triggerSync(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const businessId = req.user!.businessId!;
    const userId = req.user!.userId;
    const { type } = req.params;

    const log = await triggerSourceSync(businessId, type as any, userId);
    res.json({ success: true, data: log });
  } catch (error) {
    next(error);
  }
}

/**
 * WhatsApp Business Webhook Verification Challenge (Meta verification).
 */
export async function verifyWhatsAppWebhook(req: Request, res: Response): Promise<void> {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || 'bahiverse_webhook_secret_2026';

  if (mode === 'subscribe' && token === expectedToken) {
    res.status(200).send(challenge);
  } else {
    res.status(403).send('Forbidden');
  }
}

/**
 * WhatsApp Business Incoming Message Webhook.
 */
export async function receiveWhatsAppWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await handleWhatsAppWebhook(req.body);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}
