import { Router } from 'express';
import {
  handleAiQuery,
  handleActionConfirm,
  getQuerySuggestions,
} from '../controllers/aiController.js';
import { authenticate, requireBusiness } from '../middleware/auth.js';

export const aiRouter = Router();

aiRouter.use(authenticate, requireBusiness);

aiRouter.post('/query', handleAiQuery);
aiRouter.post('/action/confirm', handleActionConfirm);
aiRouter.get('/suggestions', getQuerySuggestions);
