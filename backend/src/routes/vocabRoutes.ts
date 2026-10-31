import { Router } from 'express';
import { listVocab, createVocab, updateVocab, updateVocabStatus, deleteVocab } from '../controllers/vocabController.js';
import { authenticate, requireBusiness } from '../middleware/auth.js';

export const vocabRouter = Router();

vocabRouter.use(authenticate, requireBusiness);

vocabRouter.get('/', listVocab);
vocabRouter.post('/', createVocab);
vocabRouter.put('/:id', updateVocab);
vocabRouter.patch('/:id/status', updateVocabStatus);
vocabRouter.delete('/:id', deleteVocab);
