import { api } from './api';

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

export async function fetchConnectedSources(): Promise<{ success: boolean; data: IntegrationSource[] }> {
  const res = await api.get('/api/integrations/sources');
  return res.data;
}

export async function getGmailConnectUrl(): Promise<{ success: boolean; data: { authUrl: string } }> {
  const res = await api.get('/api/integrations/gmail/connect');
  return res.data;
}

export async function completeGmailConnection(code: string): Promise<{ success: boolean; data: IntegrationSource }> {
  const res = await api.post('/api/integrations/gmail/callback', { code });
  return res.data;
}

export async function triggerSourceSync(sourceType: string): Promise<{ success: boolean; data: any }> {
  const res = await api.post(`/api/integrations/sources/${sourceType}/sync`);
  return res.data;
}

export async function disconnectSource(sourceType: string): Promise<{ success: boolean; data: IntegrationSource }> {
  const res = await api.post(`/api/integrations/sources/${sourceType}/disconnect`);
  return res.data;
}
