import { Router } from 'express';
import {
  getBusiness,
  updateBusiness,
  listCustomers,
  createCustomer,
  listProducts,
  createProduct,
  getBusinessAnalytics,
} from '../controllers/businessController.js';
import { authenticate, requireBusiness } from '../middleware/auth.js';

export const businessRouter = Router();

businessRouter.use(authenticate, requireBusiness);

businessRouter.get('/', getBusiness);
businessRouter.put('/', updateBusiness);
businessRouter.get('/analytics', getBusinessAnalytics);
businessRouter.get('/customers', listCustomers);
businessRouter.post('/customers', createCustomer);
businessRouter.get('/products', listProducts);
businessRouter.post('/products', createProduct);

