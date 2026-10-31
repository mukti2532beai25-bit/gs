import { z } from 'zod';

export const billItemSchema = z.object({
  id: z.string().uuid().optional(),
  rawDescription: z.string().min(1, 'Description is required'),
  normalizedName: z.string().optional().nullable(),
  quantity: z.number().positive('Quantity must be greater than 0'),
  unit: z.string().optional().nullable(),
  unitPrice: z.number().nonnegative().optional().nullable(),
  totalPrice: z.number().nonnegative().optional().nullable(),
});

export const updateBillReviewSchema = z.object({
  billNumber: z.string().max(60).optional().nullable(),
  billDate: z.string().max(30).optional().nullable(),
  vendorName: z.string().max(150).optional().nullable(),
  vendorPhone: z.string().max(20).optional().nullable(),
  customerName: z.string().max(150).optional().nullable(),
  customerPhone: z.string().max(20).optional().nullable(),
  subtotal: z.number().nonnegative().optional().nullable(),
  taxAmount: z.number().nonnegative().optional().nullable(),
  totalAmount: z.number().nonnegative().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  items: z.array(billItemSchema).optional(),
  newVocabTerms: z
    .array(
      z.object({
        rawTerm: z.string().min(1),
        normalizedTerm: z.string().min(1),
        category: z.string().default('product'),
      })
    )
    .optional(),
});

export const captureBillQuerySchema = z.object({
  language: z.enum(['en', 'hi', 'pa']).default('hi'),
});
