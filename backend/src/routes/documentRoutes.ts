import { Router } from 'express';
import { authenticate, requireBusiness } from '../middleware/auth.js';
import { uploadBillImage } from '../middleware/upload.js';
import {
  getInboxDocuments,
  uploadBatchDocuments,
  triggerBatchProcessing,
  updateDocumentStatus,
} from '../controllers/documentController.js';

export const documentRouter = Router();

documentRouter.use(authenticate, requireBusiness);

// Centralized Document Inbox
documentRouter.get('/', getInboxDocuments);

// Batch Document Upload (supports multiple files from Desktop or Mobile Camera)
documentRouter.post('/batch', uploadBillImage.array('documents', 20), uploadBatchDocuments);

// Batch OCR Processing
documentRouter.post('/process', triggerBatchProcessing);

// Update status of document in inbox (confirm, dismiss duplicate, etc.)
documentRouter.patch('/:id', updateDocumentStatus);
