import { Request, Response, NextFunction } from 'express';
import { demoDataRepo, DEMO_BUSINESS_ID } from '../services/demo/demoDataStore.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const DEMO_BUSINESS_PROFILE = {
  id: DEMO_BUSINESS_ID,
  name: 'BahiVerse Demo Store',
  businessType: 'Grocery and General Store',
  currency: 'INR (₹)',
  location: 'Punjab, India',
  languages: ['English', 'Hindi', 'Punjabi'],
  gstin: '03AAAAA1234A1Z1',
  address: 'Shop No. 7, GT Road, Dana Mandi, Jalandhar, Punjab - 144001',
  phone: '+91 98765 43210',
  isDemoMode: true,
  label: 'DEMO DATA — Sample business information',
};

/**
 * Returns demo store profile and comprehensive counts.
 */
export async function getDemoStatus(req: Request, res: Response): Promise<void> {
  const analytics = demoDataRepo.computeAnalytics();
  res.json({
    success: true,
    data: {
      isDemoMode: true,
      demoLabel: 'DEMO DATA — Sample business information',
      business: DEMO_BUSINESS_PROFILE,
      counts: {
        products: demoDataRepo.getProducts().length,
        customers: demoDataRepo.getCustomers().length,
        suppliers: demoDataRepo.getSuppliers().length,
        bills: demoDataRepo.getBills().length,
        purchases: demoDataRepo.getPurchases().length,
        expenses: demoDataRepo.getExpenses().length,
        payments: demoDataRepo.getPayments().length,
        inventoryAlerts: analytics.inventoryAlerts.length,
      },
      summary: analytics,
    },
  });
}

/**
 * Safely resets the isolated demo dataset to pristine condition.
 * Never deletes or alters real user/customer records.
 */
export async function resetDemoData(req: AuthenticatedRequest, res: Response): Promise<void> {
  demoDataRepo.resetToPristine();
  const analytics = demoDataRepo.computeAnalytics();

  res.json({
    success: true,
    message: 'BahiVerse Demo Store has been reset to its pristine seeded state.',
    data: {
      demoLabel: 'DEMO DATA — Sample business information',
      productsCount: demoDataRepo.getProducts().length,
      billsCount: demoDataRepo.getBills().length,
      summary: analytics,
    },
  });
}

/**
 * Lists the 25 realistic products with inventory levels and price histories.
 */
export async function getDemoProducts(req: Request, res: Response): Promise<void> {
  res.json({
    success: true,
    demoLabel: 'DEMO DATA — Sample business information',
    data: demoDataRepo.getProducts(),
  });
}

/**
 * Lists the 15 customers with reconciled balances.
 */
export async function getDemoCustomers(req: Request, res: Response): Promise<void> {
  res.json({
    success: true,
    demoLabel: 'DEMO DATA — Sample business information',
    data: demoDataRepo.getCustomers(),
  });
}

/**
 * Lists the 8 mandi/procurement suppliers.
 */
export async function getDemoSuppliers(req: Request, res: Response): Promise<void> {
  res.json({
    success: true,
    demoLabel: 'DEMO DATA — Sample business information',
    data: demoDataRepo.getSuppliers(),
  });
}

/**
 * Lists the 40 sales bills.
 */
export async function getDemoBills(req: Request, res: Response): Promise<void> {
  res.json({
    success: true,
    demoLabel: 'DEMO DATA — Sample business information',
    data: demoDataRepo.getBills(),
  });
}

/**
 * Lists the 20 purchases.
 */
export async function getDemoPurchases(req: Request, res: Response): Promise<void> {
  res.json({
    success: true,
    demoLabel: 'DEMO DATA — Sample business information',
    data: demoDataRepo.getPurchases(),
  });
}

/**
 * Lists the 25 operating expenses.
 */
export async function getDemoExpenses(req: Request, res: Response): Promise<void> {
  res.json({
    success: true,
    demoLabel: 'DEMO DATA — Sample business information',
    data: demoDataRepo.getExpenses(),
  });
}

/**
 * Lists the 30 payment transactions.
 */
export async function getDemoPayments(req: Request, res: Response): Promise<void> {
  res.json({
    success: true,
    demoLabel: 'DEMO DATA — Sample business information',
    data: demoDataRepo.getPayments(),
  });
}

/**
 * Computes dashboard analytics dynamically from seeded records.
 */
export async function getDemoAnalytics(req: Request, res: Response): Promise<void> {
  const dateFrom = req.query.from as string | undefined;
  const dateTo = req.query.to as string | undefined;
  const analytics = demoDataRepo.computeAnalytics(dateFrom, dateTo);

  res.json({
    success: true,
    demoLabel: 'DEMO DATA — Sample business information',
    data: analytics,
  });
}

/**
 * Updates a product's price with price-history audit logging.
 */
export async function updateDemoProductPrice(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { productId, newPrice } = req.body;
    if (!productId || typeof newPrice !== 'number' || newPrice <= 0) {
      res.status(400).json({ success: false, error: 'Valid productId and newPrice are required.' });
      return;
    }

    const updated = demoDataRepo.updateProductPrice(productId, newPrice);
    if (!updated) {
      res.status(404).json({ success: false, error: 'Product not found in demo database.' });
      return;
    }

    res.json({
      success: true,
      demoLabel: 'DEMO DATA — Sample business information',
      message: `Updated ${updated.name} default selling price from ₹${updated.previousPrice} to ₹${updated.currentPrice}.`,
      data: updated,
      historicalAuditNotice:
        'All historical sales bills and receipts preserved with original prices. No past records modified.',
    });
  } catch (error) {
    next(error);
  }
}
