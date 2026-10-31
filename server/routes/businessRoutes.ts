import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { requireAuth, requireBusiness, AuthRequest } from '../middleware/requireAuth.js';

const router = Router();

const BusinessSchema = z.object({
  name: z.string().min(1).max(120),
  gstin: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  language: z.enum(['en', 'hi', 'pa']).optional(),
  currency: z.string().optional(),
});

// ── GET /api/business ─────────────────────────────────────────────────────────
router.get('/', requireAuth, requireBusiness, async (req: AuthRequest, res: Response) => {
  try {
    const business = await prisma.business.findUnique({
      where: { id: req.user!.businessId! },
      include: {
        _count: { select: { bills: true, customers: true, products: true, vocabulary: true } },
      },
    });
    if (!business) return res.status(404).json({ error: 'Business not found' });
    return res.json(business);
  } catch (err) {
    console.error('[business/get]', err);
    return res.status(500).json({ error: 'Failed to fetch business' });
  }
});

// ── PUT /api/business ─────────────────────────────────────────────────────────
router.put('/', requireAuth, requireBusiness, async (req: AuthRequest, res: Response) => {
  const parse = BusinessSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'Validation failed', details: parse.error.flatten() });

  try {
    const updated = await prisma.business.update({
      where: { id: req.user!.businessId! },
      data: parse.data,
    });
    return res.json(updated);
  } catch (err) {
    console.error('[business/update]', err);
    return res.status(500).json({ error: 'Failed to update business' });
  }
});

// ── GET /api/business/customers ───────────────────────────────────────────────
router.get('/customers', requireAuth, requireBusiness, async (req: AuthRequest, res: Response) => {
  try {
    const customers = await prisma.customer.findMany({
      where: { businessId: req.user!.businessId! },
      include: { _count: { select: { bills: true } } },
      orderBy: { name: 'asc' },
    });
    return res.json(customers);
  } catch (err) {
    console.error('[business/customers]', err);
    return res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// ── POST /api/business/customers ──────────────────────────────────────────────
router.post('/customers', requireAuth, requireBusiness, async (req: AuthRequest, res: Response) => {
  const { name, phone, address } = req.body;
  if (!name) return res.status(400).json({ error: 'Customer name is required' });
  try {
    const customer = await prisma.customer.create({
      data: { businessId: req.user!.businessId!, name, phone, address },
    });
    return res.status(201).json(customer);
  } catch (err) {
    console.error('[business/customers/create]', err);
    return res.status(500).json({ error: 'Failed to create customer' });
  }
});

// ── GET /api/business/products ─────────────────────────────────────────────────
router.get('/products', requireAuth, requireBusiness, async (req: AuthRequest, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      where: { businessId: req.user!.businessId! },
      orderBy: { name: 'asc' },
    });
    return res.json(products);
  } catch (err) {
    console.error('[business/products]', err);
    return res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// ── POST /api/business/products ────────────────────────────────────────────────
router.post('/products', requireAuth, requireBusiness, async (req: AuthRequest, res: Response) => {
  const { name, unit, defaultPrice, category } = req.body;
  if (!name) return res.status(400).json({ error: 'Product name is required' });
  try {
    const product = await prisma.product.create({
      data: { businessId: req.user!.businessId!, name, unit: unit || 'piece', defaultPrice: defaultPrice ?? null, category: category ?? null },
    });
    return res.status(201).json(product);
  } catch (err) {
    console.error('[business/products/create]', err);
    return res.status(500).json({ error: 'Failed to create product' });
  }
});

export default router;
