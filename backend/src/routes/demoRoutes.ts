import { Router } from 'express';
import { authenticate, requireBusiness } from '../middleware/auth.js';
import {
  getDemoStatus,
  resetDemoData,
  getDemoProducts,
  getDemoCustomers,
  getDemoSuppliers,
  getDemoBills,
  getDemoPurchases,
  getDemoExpenses,
  getDemoPayments,
  getDemoAnalytics,
  updateDemoProductPrice,
} from '../controllers/demoController.js';

export const demoRouter = Router();

// Public status check
demoRouter.get('/status', getDemoStatus);

// Authenticated Demo Endpoints
demoRouter.use(authenticate, requireBusiness);
demoRouter.post('/reset', resetDemoData);
demoRouter.get('/products', getDemoProducts);
demoRouter.get('/customers', getDemoCustomers);
demoRouter.get('/suppliers', getDemoSuppliers);
demoRouter.get('/bills', getDemoBills);
demoRouter.get('/purchases', getDemoPurchases);
demoRouter.get('/expenses', getDemoExpenses);
demoRouter.get('/payments', getDemoPayments);
demoRouter.get('/analytics', getDemoAnalytics);
demoRouter.post('/price-update', updateDemoProductPrice);
