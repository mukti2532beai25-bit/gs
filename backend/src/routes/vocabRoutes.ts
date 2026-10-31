import { Router } from 'express';
import { listVocab, createVocab, deleteVocab } from '../controllers/vocabController.js';
import { authenticate, requireBusiness } from '../middleware/auth.js';

export const vocabRouter = Router();

vocabRouter.use(authenticate, requireBusiness);

vocabRouter.get('/', listVocab);
vocabRouter.post('/', createVocab);
vocabRouter.delete('/:id', deleteVocab);
