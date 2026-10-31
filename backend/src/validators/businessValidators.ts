import { z } from 'zod';

export const updateBusinessSchema = z.object({
  name: z.string().min(2).max(150),
  gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format').optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email().optional().nullable(),
  language: z.enum(['en', 'hi', 'pa']).optional(),
  currency: z.string().max(10).optional(),
});

export const createCustomerSchema = z.object({
  name: z.string().min(1).max(150),
  phone: z.string().max(20).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
});

export const createProductSchema = z.object({
  name: z.string().min(1).max(150),
  unit: z.string().default('piece'),
  defaultPrice: z.number().nonnegative().optional().nullable(),
  category: z.string().max(60).optional().nullable(),
});
