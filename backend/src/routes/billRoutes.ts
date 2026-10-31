import { Router } from 'express';
import {
  listBills,
  getBillStats,
  getBillById,
  captureBill,
  updateBillReview,
  approveBill,
  deleteBill,
} from '../controllers/billController.js';
import { authenticate, requireBusiness } from '../middleware/auth.js';
import { uploadBillImage } from '../middleware/upload.js';

export const billRouter = Router();

billRouter.use(authenticate, requireBusiness);

billRouter.get('/', listBills);
billRouter.get('/stats', getBillStats);
billRouter.get('/:id', getBillById);
billRouter.post('/capture', uploadBillImage.single('image'), captureBill);
billRouter.put('/:id/review', updateBillReview);
billRouter.patch('/:id/approve', approveBill);
billRouter.delete('/:id', deleteBill);
