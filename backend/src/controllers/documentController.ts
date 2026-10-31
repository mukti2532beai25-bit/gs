import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import {
  listInboxDocuments,
  ingestDocument,
  processBatchDocuments,
  updateInboxDocument,
  DocumentSourceType,
} from '../services/documents/ingestionService.js';
import path from 'path';
import fs from 'fs';

/**
 * Lists documents in the inbox.
 */
export async function getInboxDocuments(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const businessId = req.user!.businessId!;
    const status = req.query.status as string | undefined;
    const source = req.query.source as string | undefined;
    const search = req.query.search as string | undefined;

    const result = await listInboxDocuments(businessId, { status, source, search });

    res.json({
      success: true,
      data: result.documents,
      counts: result.counts,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handles batch document upload from Desktop or Mobile Camera.
 */
export async function uploadBatchDocuments(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const businessId = req.user!.businessId!;
    const userId = req.user!.userId;
    const files = req.files as Express.Multer.File[] | undefined;

    if (!files || files.length === 0) {
      res.status(400).json({ success: false, error: 'No document files provided for upload.' });
      return;
    }

    const sourceType: DocumentSourceType = (req.body.sourceType as DocumentSourceType) || 'camera_batch';
    const sourceDetails = req.body.sourceDetails || `Batch capture with ${files.length} pages/documents`;

    const ingested: any[] = [];
    for (const file of files) {
      const fileUrl = `/uploads/${path.basename(file.path)}`;
      const fileBuffer = file.buffer || (file.path && fs.existsSync(file.path) ? fs.readFileSync(file.path) : Buffer.from(file.filename || 'simulated-payload'));
      const doc = await ingestDocument({
        businessId,
        userId,
        fileName: file.originalname || `Scan_${Date.now()}.jpg`,
        fileBuffer,
        fileUrl,
        fileSize: file.size,
        mimeType: file.mimetype,
        sourceType,
        sourceDetails,
      });
      ingested.push(doc);
    }

    res.status(201).json({
      success: true,
      data: {
        totalUploaded: ingested.length,
        duplicatesDetected: ingested.filter((d) => d.status === 'duplicate').length,
        documents: ingested,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Triggers batch OCR processing for queued documents.
 */
export async function triggerBatchProcessing(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const businessId = req.user!.businessId!;
    const { documentIds } = req.body;

    if (!Array.isArray(documentIds) || documentIds.length === 0) {
      res.status(400).json({ success: false, error: 'documentIds array is required.' });
      return;
    }

    const processed = await processBatchDocuments(businessId, documentIds);

    res.json({
      success: true,
      data: {
        processedCount: processed.length,
        documents: processed,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Updates a document's status (e.g. mark confirmed, dismiss duplicate).
 */
export async function updateDocumentStatus(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const businessId = req.user!.businessId!;
    const docId = req.params.id;
    const { status, notes } = req.body;

    const updated = await updateInboxDocument(businessId, docId, {
      status,
      errorMessage: notes,
    });

    if (!updated) {
      res.status(404).json({ success: false, error: 'Document not found.' });
      return;
    }

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}
