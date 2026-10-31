import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { requireAuth, requireBusiness, AuthRequest } from '../middleware/requireAuth.js';
import { generateExport } from '../services/exportService.js';

const router = Router();

const ExportSchema = z.object({
  format: z.enum(['csv', 'json', 'tally-xml']),
  billIds: z.array(z.string()).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  allApproved: z.boolean().optional(),
});

// ── POST /api/export ──────────────────────────────────────────────────────────
router.post('/', requireAuth, requireBusiness, async (req: AuthRequest, res: Response) => {
  const parse = ExportSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'Validation failed', details: parse.error.flatten() });

  const { format, billIds, dateFrom, dateTo, allApproved } = parse.data;
  const businessId = req.user!.businessId!;

  try {
    let targetBillIds = billIds ?? [];

    if (allApproved) {
      const where: any = { businessId, status: 'approved' };
      if (dateFrom) where.createdAt = { gte: new Date(dateFrom) };
      if (dateTo) where.createdAt = { ...(where.createdAt ?? {}), lte: new Date(dateTo) };
      const bills = await prisma.bill.findMany({ where, select: { id: true } });
      targetBillIds = bills.map(b => b.id);
    }

    if (targetBillIds.length === 0) {
      return res.status(400).json({ error: 'No bills selected for export' });
    }

    // Verify all bills belong to this business
    const verified = await prisma.bill.count({
      where: { id: { in: targetBillIds }, businessId },
    });
    if (verified !== targetBillIds.length) {
      return res.status(403).json({ error: 'Some bills do not belong to your business' });
    }

    const business = await prisma.business.findUnique({ where: { id: businessId } });
    const result = await generateExport({
      billIds: targetBillIds,
      format,
      businessName: business?.name,
      dateFrom,
      dateTo,
    });

    // Save export record
    const exportRecord = await prisma.exportRecord.create({
      data: {
        userId: req.user!.userId,
        format,
        fileName: result.fileName,
        billCount: targetBillIds.length,
        dateFrom: dateFrom ? new Date(dateFrom) : null,
        dateTo: dateTo ? new Date(dateTo) : null,
        bills: { create: targetBillIds.map(billId => ({ billId })) },
      },
    });

    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
    res.setHeader('X-Export-Id', exportRecord.id);
    return res.send(result.content);
  } catch (err: any) {
    console.error('[export/generate]', err);
    return res.status(500).json({ error: err.message || 'Export failed' });
  }
});

// ── GET /api/export/history ───────────────────────────────────────────────────
router.get('/history', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const history = await prisma.exportRecord.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return res.json(history);
  } catch (err) {
    console.error('[export/history]', err);
    return res.status(500).json({ error: 'Failed to fetch export history' });
  }
});

export default router;
