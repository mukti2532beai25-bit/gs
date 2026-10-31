import { ingestDocument } from '../documents/ingestionService.js';

export interface IntegrationSource {
  id: string;
  type: 'gmail' | 'whatsapp' | 'email_inbox';
  name: string;
  status: 'connected' | 'disconnected' | 'syncing' | 'error';
  lastSyncAt?: string;
  details?: {
    email?: string;
    monitoredLabel?: string;
    phoneNumber?: string;
    forwardingAddress?: string;
    webhookUrl?: string;
    totalIngested?: number;
    errorReason?: string;
  };
}

export interface SyncJobLog {
  id: string;
  sourceType: string;
  startedAt: string;
  completedAt?: string;
  status: 'in_progress' | 'success' | 'failed';
  documentsFound: number;
  documentsIngested: number;
  duplicateCount: number;
  details?: string;
}

// In-memory store of configured integration sources per business
const integrationSources: Record<string, IntegrationSource[]> = {};
const syncLogs: Record<string, SyncJobLog[]> = {};

/**
 * Initializes default sources for a business if not yet created.
 */
function getOrCreateSources(businessId: string): IntegrationSource[] {
  if (!integrationSources[businessId]) {
    integrationSources[businessId] = [
      {
        id: 'source-gmail',
        type: 'gmail',
        name: 'Gmail Auto-Fetch',
        status: 'disconnected',
        details: {
          monitoredLabel: 'INBOX/Invoices',
          totalIngested: 14,
        },
      },
      {
        id: 'source-whatsapp',
        type: 'whatsapp',
        name: 'WhatsApp Business Inward',
        status: 'connected',
        lastSyncAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        details: {
          phoneNumber: '+91 80000 12345',
          webhookUrl: '/api/integrations/whatsapp/webhook',
          totalIngested: 28,
        },
      },
      {
        id: 'source-email-inbox',
        type: 'email_inbox',
        name: 'Dedicated Invoice Mailbox',
        status: 'connected',
        lastSyncAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        details: {
          forwardingAddress: `invoices-demo-store@inbox.bahiverse.ai`,
          totalIngested: 37,
        },
      },
    ];
  }
  return integrationSources[businessId];
}

/**
 * Lists all connected integration sources for a business.
 */
export async function getSources(businessId: string): Promise<IntegrationSource[]> {
  return getOrCreateSources(businessId);
}

/**
 * Initiates Gmail OAuth 2.0 connection.
 */
export async function getGmailAuthUrl(businessId: string): Promise<{ authUrl: string }> {
  const clientId = process.env.GOOGLE_CLIENT_ID || 'dummy_client_id.apps.googleusercontent.com';
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5173/dashboard?tab=sources&oauth=gmail';
  const state = Buffer.from(JSON.stringify({ businessId, timestamp: Date.now() })).toString('base64');
  
  // Real OAuth2 authorization endpoint
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
    clientId
  )}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=https://www.googleapis.com/auth/gmail.readonly&access_type=offline&state=${state}`;

  return { authUrl };
}

/**
 * Completes Gmail OAuth callback and connects the source.
 */
export async function handleGmailCallback(
  businessId: string,
  _code: string
): Promise<IntegrationSource> {
  const sources = getOrCreateSources(businessId);
  const gmail = sources.find((s) => s.type === 'gmail');
  if (gmail) {
    gmail.status = 'connected';
    gmail.lastSyncAt = new Date().toISOString();
    gmail.details = {
      ...gmail.details,
      email: 'business.owner@gmail.com',
      monitoredLabel: 'INBOX/Invoices',
      errorReason: undefined,
    };
    return gmail;
  }
  throw new Error('Gmail source not found');
}

/**
 * Disconnects an integration source.
 */
export async function disconnectSource(
  businessId: string,
  sourceType: 'gmail' | 'whatsapp' | 'email_inbox'
): Promise<IntegrationSource> {
  const sources = getOrCreateSources(businessId);
  const src = sources.find((s) => s.type === sourceType);
  if (!src) throw new Error(`Source ${sourceType} not found`);

  src.status = 'disconnected';
  if (src.details) {
    src.details.errorReason = undefined;
  }
  return src;
}

/**
 * Manually triggers a synchronization cycle for a specific source.
 */
export async function triggerSourceSync(
  businessId: string,
  sourceType: 'gmail' | 'whatsapp' | 'email_inbox',
  userId: string
): Promise<SyncJobLog> {
  const sources = getOrCreateSources(businessId);
  const src = sources.find((s) => s.type === sourceType);
  if (!src) throw new Error(`Source ${sourceType} not found`);
  if (src.status === 'disconnected') {
    throw new Error(`Cannot synchronize disconnected source: ${sourceType}. Please connect it first.`);
  }

  const logId = `sync-${Date.now()}`;
  const log: SyncJobLog = {
    id: logId,
    sourceType,
    startedAt: new Date().toISOString(),
    status: 'in_progress',
    documentsFound: 0,
    documentsIngested: 0,
    duplicateCount: 0,
  };

  if (!syncLogs[businessId]) syncLogs[businessId] = [];
  syncLogs[businessId].unshift(log);

  // Ingest sample invoice representing the synced document from this source
  const sampleBuffer = Buffer.from(`Simulated document payload from ${sourceType} at ${new Date().toISOString()}`);
  const sampleName = `${sourceType.toUpperCase()}_Sync_Invoice_${Date.now().toString().slice(-4)}.pdf`;

  const newDoc = await ingestDocument({
    businessId,
    userId,
    fileName: sampleName,
    fileBuffer: sampleBuffer,
    fileUrl: '/uploads/sample-invoices/sample-1.png',
    fileSize: 124800,
    mimeType: 'application/pdf',
    sourceType: sourceType === 'gmail' ? 'gmail' : sourceType === 'whatsapp' ? 'whatsapp' : 'email_inbox',
    sourceDetails: `Auto-ingested during sync cycle #${logId.slice(-6)}`,
    preParsedMeta: {
      invoiceNumber: `SYNC-${Math.floor(1000 + Math.random() * 9000)}`,
      vendorName: sourceType === 'gmail' ? 'Google Cloud & Hardware' : 'Regional Mandi Wholesale',
      billDate: new Date().toISOString().split('T')[0],
      totalAmount: Math.floor(1200 + Math.random() * 5000),
    },
  });

  log.documentsFound = 1;
  if (newDoc.status === 'duplicate') {
    log.duplicateCount = 1;
  } else {
    log.documentsIngested = 1;
  }

  log.completedAt = new Date().toISOString();
  log.status = 'success';
  log.details = `Sync completed. Ingested doc ${newDoc.id} (${newDoc.status})`;

  src.lastSyncAt = log.completedAt;
  if (src.details?.totalIngested !== undefined) {
    src.details.totalIngested += log.documentsIngested;
  }

  return log;
}

/**
 * Handles incoming WhatsApp webhook events.
 */
export async function handleWhatsAppWebhook(
  payload: any,
  defaultBusinessId = '00000000-0000-0000-0000-000000000002'
): Promise<{ processed: boolean; documentId?: string }> {
  // If webhook contains an image/document message
  const entry = payload?.entry?.[0];
  const changes = entry?.changes?.[0];
  const value = changes?.value;
  const message = value?.messages?.[0];

  if (message && (message.type === 'image' || message.type === 'document')) {
    const fromPhone = message.from || '+91 99999 88888';
    const fakeBuffer = Buffer.from(`WhatsApp Document Message ID: ${message.id}`);
    const doc = await ingestDocument({
      businessId: defaultBusinessId,
      userId: '00000000-0000-0000-0000-000000000001',
      fileName: `WhatsApp_${message.type}_${message.id || Date.now()}.jpg`,
      fileBuffer: fakeBuffer,
      fileUrl: '/uploads/sample-invoices/sample-2.png',
      fileSize: 250000,
      mimeType: 'image/jpeg',
      sourceType: 'whatsapp',
      sourceDetails: `WhatsApp message from ${fromPhone}`,
      preParsedMeta: {
        vendorName: 'WhatsApp Contact',
        billDate: new Date().toISOString().split('T')[0],
      },
    });

    return { processed: true, documentId: doc.id };
  }

  return { processed: false };
}
