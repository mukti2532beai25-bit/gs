import { Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { updateBusinessSchema, createCustomerSchema, createProductSchema } from '../validators/businessValidators.js';

export async function getBusiness(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const businessId = req.user!.businessId!;
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        _count: { select: { bills: true, customers: true, products: true, vocabulary: true } },
      },
    });

    if (!business) {
      res.status(404).json({ success: false, error: 'Business profile not found.' });
      return;
    }

    res.json({ success: true, data: business });
  } catch (error) {
    next(error);
  }
}

export async function updateBusiness(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const businessId = req.user!.businessId!;
    const input = updateBusinessSchema.parse(req.body);

    const updated = await prisma.business.update({
      where: { id: businessId },
      data: input,
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
}

export async function listCustomers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const businessId = req.user!.businessId!;
    const customers = await prisma.customer.findMany({
      where: { businessId },
      include: { _count: { select: { bills: true } } },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: customers });
  } catch (error) {
    next(error);
  }
}

export async function createCustomer(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const businessId = req.user!.businessId!;
    const input = createCustomerSchema.parse(req.body);
    const customer = await prisma.customer.create({
      data: { businessId, ...input },
    });
    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
}

export async function listProducts(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const businessId = req.user!.businessId!;
    const products = await prisma.product.findMany({
      where: { businessId },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
}

export async function createProduct(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const businessId = req.user!.businessId!;
    const input = createProductSchema.parse(req.body);
    const product = await prisma.product.create({
      data: { businessId, ...input },
    });
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
}
