import { z } from 'zod';

export const createVocabSchema = z.object({
  rawTerm: z.string().min(1).max(100),
  normalizedTerm: z.string().min(1).max(150),
  category: z.enum(['product', 'unit', 'customer', 'misc']).default('product'),
  language: z.enum(['en', 'hi', 'pa']).default('hi'),
});

export const voiceCommandSchema = z.object({
  transcript: z.string().min(1, 'Transcript is required'),
  language: z.enum(['en', 'hi', 'pa']).default('hi'),
  billId: z.string().uuid().optional(),
});

export const exportRequestSchema = z.object({
  format: z.enum(['csv', 'json', 'tally-xml']).default('csv'),
  entity: z.enum(['bills', 'customers', 'products', 'items', 'vocabulary']).default('bills'),
  billIds: z.array(z.string().uuid()).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  status: z.string().optional(),
  customerId: z.string().optional(),
  allApproved: z.boolean().default(false),
  preview: z.boolean().optional(),
});
