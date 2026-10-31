import { Router } from 'express';
import { authenticate, requireBusiness } from '../middleware/auth.js';
import {
  getCaPreparationData,
  validateCaExport,
  downloadCaExport,
} from '../controllers/caExportController.js';

export const caExportRouter = Router();

caExportRouter.use(authenticate, requireBusiness);

// Operational and GSTR prep registers
caExportRouter.get('/data', getCaPreparationData);

// Pre-export reconciliation & validation
caExportRouter.get('/validate', validateCaExport);

// Download CA package (Excel .xlsx, CSV, or JSON)
caExportRouter.post('/download', downloadCaExport);
