import { Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { createVocabSchema } from '../validators/vocabValidators.js';

export async function listVocab(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const businessId = req.user!.businessId!;
    const category = req.query.category as string | undefined;
    const language = req.query.language as string | undefined;

    const where: any = { businessId };
    if (category) where.category = category;
    if (language) where.language = language;

    const vocab = await prisma.vocabularyMapping.findMany({
      where,
      orderBy: [{ usageCount: 'desc' }, { rawTerm: 'asc' }],
    });

    res.json({ success: true, data: vocab });
  } catch (error) {
    next(error);
  }
}

export async function createVocab(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const businessId = req.user!.businessId!;
    const input = createVocabSchema.parse(req.body);

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

    res.status(201).json({ success: true, data: vocab });
  } catch (error) {
    next(error);
  }
}

export async function deleteVocab(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const businessId = req.user!.businessId!;

    const vocab = await prisma.vocabularyMapping.findFirst({
      where: { id, businessId },
    });

    if (!vocab) {
      res.status(404).json({ success: false, error: 'Vocabulary entry not found.' });
      return;
    }

    await prisma.vocabularyMapping.delete({ where: { id } });
    res.json({ success: true, message: 'Vocabulary entry deleted.' });
  } catch (error) {
    next(error);
  }
}
