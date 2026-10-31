import { api } from './api';

export interface InboxDocument {
  id: string;
  businessId: string;
  userId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  fileHash: string;
  sourceType: 'upload' | 'camera_batch' | 'gmail' | 'whatsapp' | 'email_inbox';
  sourceDetails?: string;
  status: 'received' | 'queued' | 'processing' | 'review_required' | 'confirmed' | 'failed' | 'duplicate';
  duplicateInfo?: {
    isDuplicate: boolean;
    confidence: number;
    reason: string;
    matchedId?: string;
    duplicateType?: string;
  };
  extractedMetadata?: {
    billNumber?: string;
    billDate?: string;
    vendorName?: string;
    customerName?: string;
    subtotal?: number;
    taxAmount?: number;
    totalAmount?: number;
    itemsCount?: number;
    ocrConfidence?: number;
  };
  linkedBillId?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentInboxResponse {
  success: boolean;
  data: InboxDocument[];
  counts: Record<string, number>;
}

export async function fetchInboxDocuments(params?: {
  status?: string;
  source?: string;
  search?: string;
}): Promise<DocumentInboxResponse> {
  const query = new URLSearchParams();
  if (params?.status && params.status !== 'all') query.set('status', params.status);
  if (params?.source && params.source !== 'all') query.set('source', params.source);
  if (params?.search) query.set('search', params.search);

  const res = await api.get(`/api/documents?${query.toString()}`);
  return res.data;
}

export async function uploadBatchDocuments(formData: FormData): Promise<{
  success: boolean;
  data: {
    totalUploaded: number;
    duplicatesDetected: number;
    documents: InboxDocument[];
  };
}> {
  const res = await api.post('/api/documents/batch', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function triggerBatchProcessing(documentIds: string[]): Promise<{
  success: boolean;
  data: {
    processedCount: number;
    documents: InboxDocument[];
  };
}> {
  const res = await api.post('/api/documents/process', { documentIds });
  return res.data;
}

export async function updateDocumentStatus(
  docId: string,
  updates: { status: string; notes?: string }
): Promise<{ success: boolean; data: InboxDocument }> {
  const res = await api.patch(`/api/documents/${docId}`, updates);
  return res.data;
}
