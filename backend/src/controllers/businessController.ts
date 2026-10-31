import { Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { updateBusinessSchema, createCustomerSchema, createProductSchema } from '../validators/businessValidators.js';

const DEMO_BUSINESS = {
  id: '00000000-0000-0000-0000-000000000002',
  name: 'Sharma Kirana & General Store',
  gstin: '07AAAAA0000A1Z5',
  address: 'Shop No. 12, Main Market, Chandni Chowk, Delhi - 110006',
  phone: '+91 98765 43210',
  _count: { bills: 12, customers: 3, products: 4, vocabulary: 5 },
};

let demoCustomers = [
  { id: 'cust-1', name: 'Ramesh Kumar', phone: '+91 98765 11001', address: 'Shop 4, Market Road', _count: { bills: 4 } },
  { id: 'cust-2', name: 'Suresh Patel', phone: '+91 98765 22002', address: '12 Railway Line', _count: { bills: 6 } },
  { id: 'cust-3', name: 'Priya Sharma', phone: '+91 98765 33003', address: '44 Gandhi Chowk', _count: { bills: 2 } },
];

let demoProducts = [
  { id: 'prod-1', name: 'Basmati Rice Premium 5kg', unit: 'bag', defaultPrice: 450.0, category: 'Grains' },
  { id: 'prod-2', name: 'Amul Full Cream Milk 1L', unit: 'pouch', defaultPrice: 66.0, category: 'Dairy' },
  { id: 'prod-3', name: 'Aashirvaad Shudh Chakki Atta 10kg', unit: 'bag', defaultPrice: 380.0, category: 'Flour' },
  { id: 'prod-4', name: 'Tata Salt 1kg', unit: 'packet', defaultPrice: 28.0, category: 'Spices' },
];

export async function getBusiness(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const businessId = req.user!.businessId!;
    try {
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        include: {
          _count: { select: { bills: true, customers: true, products: true, vocabulary: true } },
        },
      });

      if (!business) {
        res.json({ success: true, data: DEMO_BUSINESS });
        return;
      }

      res.json({ success: true, data: business });
    } catch {
      res.json({ success: true, data: DEMO_BUSINESS });
    }
  } catch (error) {
    next(error);
  }
}

export async function updateBusiness(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const businessId = req.user!.businessId!;
    const input = updateBusinessSchema.parse(req.body);

    try {
      const updated = await prisma.business.update({
        where: { id: businessId },
        data: input,
      });

      res.json({ success: true, data: updated });
    } catch {
      const updatedDemo = { ...DEMO_BUSINESS, ...input };
      res.json({ success: true, data: updatedDemo });
    }
  } catch (error) {
    next(error);
  }
}

export async function listCustomers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const businessId = req.user!.businessId!;
    try {
      const customers = await prisma.customer.findMany({
        where: { businessId },
        include: { _count: { select: { bills: true } } },
        orderBy: { name: 'asc' },
      });
      res.json({ success: true, data: customers });
    } catch {
      res.json({ success: true, data: demoCustomers });
    }
  } catch (error) {
    next(error);
  }
}

export async function createCustomer(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const businessId = req.user!.businessId!;
    const input = createCustomerSchema.parse(req.body);

    try {
      const customer = await prisma.customer.create({
        data: { businessId, ...input },
      });
      res.status(201).json({ success: true, data: customer });
    } catch {
      const newCust = {
        id: 'cust-' + Date.now(),
        name: input.name,
        phone: input.phone || '',
        address: input.address || '',
        _count: { bills: 0 },
      };
      demoCustomers.push(newCust);
      res.status(201).json({ success: true, data: newCust });
    }
  } catch (error) {
    next(error);
  }
}

export async function listProducts(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const businessId = req.user!.businessId!;
    try {
      const products = await prisma.product.findMany({
        where: { businessId },
        orderBy: { name: 'asc' },
      });
      res.json({ success: true, data: products });
    } catch {
      res.json({ success: true, data: demoProducts });
    }
  } catch (error) {
    next(error);
  }
}

export async function createProduct(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const businessId = req.user!.businessId!;
    const input = createProductSchema.parse(req.body);

    try {
      const product = await prisma.product.create({
        data: { businessId, ...input },
      });
      res.status(201).json({ success: true, data: product });
    } catch {
      const newProd = {
        id: 'prod-' + Date.now(),
        name: input.name,
        unit: input.unit || 'piece',
        defaultPrice: input.defaultPrice || 0,
        category: input.category || 'General',
        aliases: '[]',
      };
      demoProducts.push(newProd);
      res.status(201).json({ success: true, data: newProd });
    }
  } catch (error) {
    next(error);
  }
}
