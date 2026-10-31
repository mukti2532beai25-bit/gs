import { calculateFileHash, detectDuplicate, DuplicateDetectionResult, DocumentMetadata } from './duplicateService.js';
import { extractBillData } from '../ai/extractionService.js';

export type DocumentStatus =
  | 'received'
  | 'queued'
  | 'processing'
  | 'review_required'
  | 'confirmed'
  | 'failed'
  | 'duplicate';

export type DocumentSourceType =
  | 'upload'
  | 'camera_batch'
  | 'gmail'
  | 'whatsapp'
  | 'email_inbox';

export interface InboxDocument {
  id: string;
  businessId: string;
  userId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  fileHash: string;
  sourceType: DocumentSourceType;
  sourceDetails?: string;
  status: DocumentStatus;
  duplicateInfo?: DuplicateDetectionResult;
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

// In-memory document inbox store for high resilience
const inMemoryInbox: InboxDocument[] = [
  {
    id: 'doc-inbox-1',
    businessId: '00000000-0000-0000-0000-000000000002',
    userId: '00000000-0000-0000-0000-000000000001',
    fileName: 'INV-Nov-KiranaSupply.pdf',
    fileUrl: '/uploads/sample-invoices/sample-1.png',
    fileSize: 142580,
    mimeType: 'application/pdf',
    fileHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    sourceType: 'gmail',
    sourceDetails: 'From: invoices@kiranasupply.com (Subject: Tax Invoice #KS-9021)',
    status: 'review_required',
    extractedMetadata: {
      billNumber: 'KS-9021',
      billDate: '2026-10-30',
      vendorName: 'Kirana Supply Co.',
      customerName: 'BahiVerse Demo Store',
      subtotal: 4200.0,
      taxAmount: 210.0,
      totalAmount: 4410.0,
      itemsCount: 4,
      ocrConfidence: 0.94,
    },
    linkedBillId: 'demo-bill-1',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'doc-inbox-2',
    businessId: '00000000-0000-0000-0000-000000000002',
    userId: '00000000-0000-0000-0000-000000000001',
    fileName: 'WhatsApp_Doc_9876543210.jpg',
    fileUrl: '/uploads/sample-invoices/sample-2.png',
    fileSize: 284910,
    mimeType: 'image/jpeg',
    fileHash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
    sourceType: 'whatsapp',
    sourceDetails: 'Received via WhatsApp from +91 98765 43210',
    status: 'confirmed',
    extractedMetadata: {
      billNumber: 'BILL-2026-002',
      billDate: '2026-10-29',
      vendorName: 'Punjab Traders Mandi',
      customerName: 'Suresh Patel',
      subtotal: 3050.0,
      taxAmount: 150.0,
      totalAmount: 3200.0,
      itemsCount: 2,
      ocrConfidence: 0.91,
    },
    linkedBillId: 'demo-bill-2',
    createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
  {
    id: 'doc-inbox-3',
    businessId: '00000000-0000-0000-0000-000000000002',
    userId: '00000000-0000-0000-0000-000000000001',
    fileName: 'Duplicate_Receipt_Scan_001.jpg',
    fileUrl: '/uploads/sample-invoices/sample-1.png',
    fileSize: 184500,
    mimeType: 'image/jpeg',
    fileHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', // same as doc-inbox-1
    sourceType: 'camera_batch',
    sourceDetails: 'Batch Scanner Session #B-104',
    status: 'duplicate',
    duplicateInfo: {
      isDuplicate: true,
      confidence: 1.0,
      reason: 'Identical file content detected (SHA-256 hash match with doc-inbox-1).',
      matchedId: 'doc-inbox-1',
      duplicateType: 'exact_hash',
    },
    extractedMetadata: {
      billNumber: 'KS-9021',
      billDate: '2026-10-30',
      vendorName: 'Kirana Supply Co.',
      totalAmount: 4410.0,
      ocrConfidence: 0.95,
    },
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
];

/**
 * Lists documents in the inbox for a specific business, with optional status and source filtering.
 */
export async function listInboxDocuments(
  businessId: string,
  filter?: { status?: string; source?: string; search?: string }
): Promise<{ documents: InboxDocument[]; counts: Record<string, number> }> {
  let docs = inMemoryInbox.filter((d) => d.businessId === businessId);

  // Compute status counts across all documents for the business
  const counts: Record<string, number> = {
    all: docs.length,
    received: 0,
    queued: 0,
    processing: 0,
    review_required: 0,
    confirmed: 0,
    failed: 0,
    duplicate: 0,
  };

  docs.forEach((d) => {
    if (counts[d.status] !== undefined) {
      counts[d.status]++;
    }
  });

  if (filter?.status && filter.status !== 'all') {
    docs = docs.filter((d) => d.status === filter.status);
  }

  if (filter?.source && filter.source !== 'all') {
    docs = docs.filter((d) => d.sourceType === filter.source);
  }

  if (filter?.search) {
    const q = filter.search.toLowerCase();
    docs = docs.filter(
      (d) =>
        d.fileName.toLowerCase().includes(q) ||
        d.extractedMetadata?.vendorName?.toLowerCase().includes(q) ||
        d.extractedMetadata?.billNumber?.toLowerCase().includes(q) ||
        d.sourceDetails?.toLowerCase().includes(q)
    );
  }

  // Sort latest first
  docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return { documents: docs, counts };
}

/**
 * Ingests a new document into the centralized inbox.
 * Runs immediate SHA-256 computation and duplicate check against existing docs.
 */
export async function ingestDocument(params: {
  businessId: string;
  userId: string;
  fileName: string;
  fileBuffer: Buffer;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  sourceType: DocumentSourceType;
  sourceDetails?: string;
  preParsedMeta?: DocumentMetadata;
}): Promise<InboxDocument> {
  const hash = calculateFileHash(params.fileBuffer);

  // Prepare duplicate check candidates from existing inbox & bills
  const existingDocs = inMemoryInbox.filter((d) => d.businessId === params.businessId);
  const candidates = existingDocs.map((d) => ({
    id: d.id,
    fileHash: d.fileHash,
    billNumber: d.extractedMetadata?.billNumber,
    vendorName: d.extractedMetadata?.vendorName,
    customerName: d.extractedMetadata?.customerName,
    billDate: d.extractedMetadata?.billDate,
    totalAmount: d.extractedMetadata?.totalAmount,
  }));

  const dupResult = detectDuplicate(hash, params.preParsedMeta || {}, candidates);

  const docId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const status: DocumentStatus = dupResult.isDuplicate ? 'duplicate' : 'queued';

  const newDoc: InboxDocument = {
    id: docId,
    businessId: params.businessId,
    userId: params.userId,
    fileName: params.fileName,
    fileUrl: params.fileUrl,
    fileSize: params.fileSize,
    mimeType: params.mimeType,
    fileHash: hash,
    sourceType: params.sourceType,
    sourceDetails: params.sourceDetails || `Direct Ingestion via ${params.sourceType}`,
    status,
    duplicateInfo: dupResult.isDuplicate ? dupResult : undefined,
    extractedMetadata: params.preParsedMeta ? {
      billNumber: params.preParsedMeta.invoiceNumber,
      billDate: params.preParsedMeta.billDate,
      vendorName: params.preParsedMeta.vendorName,
      customerName: params.preParsedMeta.customerName,
      totalAmount: params.preParsedMeta.totalAmount,
    } : undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  inMemoryInbox.unshift(newDoc);
  return newDoc;
}

/**
 * Triggers batch OCR processing on a set of queued or received documents.
 */
export async function processBatchDocuments(
  businessId: string,
  docIds: string[]
): Promise<InboxDocument[]> {
  const processed: InboxDocument[] = [];

  for (const id of docIds) {
    const doc = inMemoryInbox.find((d) => d.id === id && d.businessId === businessId);
    if (!doc) continue;

    if (doc.status === 'duplicate') {
      // Keep duplicate status unless explicitly forced
      processed.push(doc);
      continue;
    }

    doc.status = 'processing';
    doc.updatedAt = new Date().toISOString();

    try {
      // Run AI OCR / extraction
      const extracted = await extractBillData(doc.fileUrl, 'demo-text');
      doc.extractedMetadata = {
        billNumber: extracted.billNumber || `BATCH-${Date.now().toString().slice(-4)}`,
        billDate: extracted.billDate || new Date().toISOString().split('T')[0],
        vendorName: extracted.vendorName || 'Extracted Vendor',
        customerName: extracted.customerName || 'General Customer',
        subtotal: extracted.subtotal,
        taxAmount: extracted.taxAmount,
        totalAmount: extracted.totalAmount,
        itemsCount: extracted.items?.length || 1,
        ocrConfidence: extracted.confidence || 0.88,
      };
      doc.status = 'review_required';
    } catch (err: any) {
      doc.status = 'failed';
      doc.errorMessage = err.message || 'OCR extraction failed';
    }

    doc.updatedAt = new Date().toISOString();
    processed.push(doc);
  }

  return processed;
}

/**
 * Updates document status in inbox (e.g., mark as confirmed, dismiss duplicate, etc.).
 */
export async function updateInboxDocument(
  businessId: string,
  docId: string,
  updates: Partial<InboxDocument>
): Promise<InboxDocument | null> {
  const doc = inMemoryInbox.find((d) => d.id === docId && d.businessId === businessId);
  if (!doc) return null;

  Object.assign(doc, updates, { updatedAt: new Date().toISOString() });
  return doc;
}
