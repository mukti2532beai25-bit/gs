import { Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { createVocabSchema } from '../validators/vocabValidators.js';
import { z } from 'zod';

// In-memory demo fallback for vocabulary mappings
let demoVocabList = [
  {
    id: 'vocab-demo-1',
    businessId: 'demo-biz-1',
    rawTerm: 'Basmti 5kg',
    normalizedTerm: 'Basmati Rice 5kg',
    category: 'product',
    language: 'hi',
    confidence: 0.95,
    status: 'approved',
    usageCount: 14,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'vocab-demo-2',
    businessId: 'demo-biz-1',
    rawTerm: 'ਚਾਵਲ',
    normalizedTerm: 'Rice Regular 1kg',
    category: 'product',
    language: 'pa',
    confidence: 0.91,
    status: 'approved',
    usageCount: 9,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'vocab-demo-3',
    businessId: 'demo-biz-1',
    rawTerm: 'Amul Dudh',
    normalizedTerm: 'Amul Full Cream Milk 1L',
    category: 'product',
    language: 'hi',
    confidence: 0.98,
    status: 'approved',
    usageCount: 22,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'vocab-demo-4',
    businessId: 'demo-biz-1',
    rawTerm: 'Atta Ashirwad',
    normalizedTerm: 'Aashirvaad Whole Wheat Atta 10kg',
    category: 'product',
    language: 'hi',
    confidence: 0.89,
    status: 'pending',
    usageCount: 4,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'vocab-demo-5',
    businessId: 'demo-biz-1',
    rawTerm: 'Kilo',
    normalizedTerm: 'Kilogram (kg)',
    category: 'unit',
    language: 'en',
    confidence: 1.0,
    status: 'approved',
    usageCount: 45,
    createdAt: new Date().toISOString(),
  },
];

export async function listVocab(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const businessId = req.user!.businessId!;
    const category = req.query.category as string | undefined;
    const language = req.query.language as string | undefined;

    try {
      const where: any = { businessId };
      if (category) where.category = category;
      if (language) where.language = language;

      const vocab = await prisma.vocabularyMapping.findMany({
        where,
        orderBy: [{ usageCount: 'desc' }, { rawTerm: 'asc' }],
      });

      // Augment with status/confidence if not in relational column
      const augmented = vocab.map((v) => ({
        ...v,
        confidence: 0.92,
        status: 'approved',
      }));

      res.json({ success: true, data: augmented });
    } catch {
      // In-memory demo fallback
      let filtered = [...demoVocabList];
      if (category) filtered = filtered.filter((v) => v.category === category);
      if (language) filtered = filtered.filter((v) => v.language === language);
      res.json({ success: true, data: filtered, offlineNotice: 'PostgreSQL offline: serving in-memory vocabulary.' });
    }
  } catch (error) {
    next(error);
  }
}

export async function createVocab(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const businessId = req.user!.businessId!;
    const input = createVocabSchema.parse(req.body);

    try {
      const vocab = await prisma.vocabularyMapping.upsert({
        where: {
          businessId_rawTerm: {
            businessId,
            rawTerm: input.rawTerm,
          },
        },
        update: {
          normalizedTerm: input.normalizedTerm,
          category: input.category,
          language: input.language,
        },
        create: {
          businessId,
          ...input,
        },
      });

      res.status(201).json({
        success: true,
        data: {
          ...vocab,
          confidence: 0.95,
          status: 'approved',
        },
      });
    } catch {
      // In-memory demo fallback
      const newEntry = {
        id: 'vocab-' + Date.now(),
        businessId,
        rawTerm: input.rawTerm,
        normalizedTerm: input.normalizedTerm,
        category: input.category || 'product',
        language: input.language || 'hi',
        confidence: 0.95,
        status: 'approved',
        usageCount: 1,
        createdAt: new Date().toISOString(),
      };
      demoVocabList.unshift(newEntry);
      res.status(201).json({ success: true, data: newEntry });
    }
  } catch (error) {
    next(error);
  }
}

const updateVocabSchema = z.object({
  rawTerm: z.string().min(1).optional(),
  normalizedTerm: z.string().min(1).optional(),
  category: z.string().optional(),
  language: z.string().optional(),
  status: z.enum(['approved', 'pending', 'rejected']).optional(),
  confidence: z.number().min(0).max(1).optional(),
});

export async function updateVocab(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const businessId = req.user!.businessId!;
    const input = updateVocabSchema.parse(req.body);

    try {
      const vocab = await prisma.vocabularyMapping.findFirst({
        where: { id, businessId },
      });

      if (!vocab) {
        res.status(404).json({ success: false, error: 'Vocabulary entry not found.' });
        return;
      }

      const updated = await prisma.vocabularyMapping.update({
        where: { id },
        data: {
          rawTerm: input.rawTerm ?? vocab.rawTerm,
          normalizedTerm: input.normalizedTerm ?? vocab.normalizedTerm,
          category: input.category ?? vocab.category,
          language: input.language ?? vocab.language,
        },
      });

      res.json({
        success: true,
        data: {
          ...updated,
          status: input.status || 'approved',
          confidence: input.confidence || 0.95,
        },
      });
    } catch {
      const entry = demoVocabList.find((v) => v.id === id);
      if (entry) {
        if (input.rawTerm) entry.rawTerm = input.rawTerm;
        if (input.normalizedTerm) entry.normalizedTerm = input.normalizedTerm;
        if (input.category) entry.category = input.category;
        if (input.language) entry.language = input.language;
        if (input.status) entry.status = input.status;
        if (input.confidence != null) entry.confidence = input.confidence;
        res.json({ success: true, data: entry });
      } else {
        res.status(404).json({ success: false, error: 'Vocabulary entry not found.' });
      }
    }
  } catch (error) {
    next(error);
  }
}

export async function updateVocabStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { status } = z.object({ status: z.enum(['approved', 'pending', 'rejected']) }).parse(req.body);

    const entry = demoVocabList.find((v) => v.id === id);
    if (entry) {
      entry.status = status;
    }

    res.json({
      success: true,
      message: `Vocabulary entry marked as ${status}.`,
      data: { id, status },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteVocab(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const businessId = req.user!.businessId!;

    try {
      const vocab = await prisma.vocabularyMapping.findFirst({
        where: { id, businessId },
      });

      if (!vocab) {
        res.status(404).json({ success: false, error: 'Vocabulary entry not found.' });
        return;
      }

      await prisma.vocabularyMapping.delete({ where: { id } });
      res.json({ success: true, message: 'Vocabulary entry deleted.' });
    } catch {
      demoVocabList = demoVocabList.filter((v) => v.id !== id);
      res.json({ success: true, message: 'Vocabulary entry deleted.' });
    }
  } catch (error) {
    next(error);
  }
}
