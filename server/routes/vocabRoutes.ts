import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { requireAuth, requireBusiness, AuthRequest } from '../middleware/requireAuth.js';

const router = Router();

const VocabSchema = z.object({
  rawTerm: z.string().min(1).max(100),
  normalizedTerm: z.string().min(1).max(100),
  category: z.enum(['product', 'unit', 'customer', 'misc']).optional(),
  language: z.enum(['en', 'hi', 'pa']).optional(),
});

// ── GET /api/vocab ────────────────────────────────────────────────────────────
router.get('/', requireAuth, requireBusiness, async (req: AuthRequest, res: Response) => {
  const category = req.query.category as string | undefined;
  const language = req.query.language as string | undefined;
  const search = req.query.search as string | undefined;

  const where: any = { businessId: req.user!.businessId };
  if (category) where.category = category;
  if (language) where.language = language;
  if (search) where.OR = [
    { rawTerm: { contains: search } },
    { normalizedTerm: { contains: search } },
  ];

  try {
    const vocab = await prisma.vocabularyMapping.findMany({
      where,
      orderBy: [{ usageCount: 'desc' }, { rawTerm: 'asc' }],
    });
    return res.json(vocab);
  } catch (err) {
    console.error('[vocab/list]', err);
    return res.status(500).json({ error: 'Failed to fetch vocabulary' });
  }
});

// ── POST /api/vocab ───────────────────────────────────────────────────────────
router.post('/', requireAuth, requireBusiness, async (req: AuthRequest, res: Response) => {
  const parse = VocabSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'Validation failed', details: parse.error.flatten() });

  try {
    const entry = await prisma.vocabularyMapping.upsert({
      where: {
        businessId_rawTerm: {
          businessId: req.user!.businessId!,
          rawTerm: parse.data.rawTerm,
        },
      },
      update: { normalizedTerm: parse.data.normalizedTerm, category: parse.data.category, language: parse.data.language },
      create: {
        businessId: req.user!.businessId!,
        ...parse.data,
        category: parse.data.category ?? 'product',
        language: parse.data.language ?? 'hi',
      },
    });
    return res.status(201).json(entry);
  } catch (err) {
    console.error('[vocab/create]', err);
    return res.status(500).json({ error: 'Failed to save vocabulary entry' });
  }
});

// ── DELETE /api/vocab/:id ─────────────────────────────────────────────────────
router.delete('/:id', requireAuth, requireBusiness, async (req: AuthRequest, res: Response) => {
  try {
    const entry = await prisma.vocabularyMapping.findFirst({
      where: { id: req.params.id, businessId: req.user!.businessId! },
    });
    if (!entry) return res.status(404).json({ error: 'Vocabulary entry not found' });

    await prisma.vocabularyMapping.delete({ where: { id: req.params.id } });
    return res.json({ deleted: true });
  } catch (err) {
    console.error('[vocab/delete]', err);
    return res.status(500).json({ error: 'Failed to delete vocabulary entry' });
  }
});

export default router;
