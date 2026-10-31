import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';
import { prisma } from '../db.js';
import { requireAuth, requireBusiness, AuthRequest } from '../middleware/requireAuth.js';
import { extractBillFromImage, parseVoiceCommand } from '../services/extractionService.js';

const router = Router();

// ── Multer setup ─────────────────────────────────────────────────────────────
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB || '10')) * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|webp|heic|pdf)$/i;
    if (allowed.test(file.originalname)) cb(null, true);
    else cb(new Error('Only image files (JPG, PNG, WEBP, HEIC, PDF) are allowed'));
  },
});

// ── GET /api/bills ────────────────────────────────────────────────────────────
router.get('/', requireAuth, requireBusiness, async (req: AuthRequest, res: Response) => {
  const page = parseInt(String(req.query.page || '1'));
  const limit = parseInt(String(req.query.limit || '20'));
  const status = req.query.status as string | undefined;

  const where: any = { businessId: req.user!.businessId };
  if (status) where.status = status;

  try {
    const [bills, total] = await Promise.all([
      prisma.bill.findMany({
        where,
        include: { customer: true, _count: { select: { items: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.bill.count({ where }),
    ]);

    return res.json({ bills, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[bills/list]', err);
    return res.status(500).json({ error: 'Failed to fetch bills' });
  }
});

// ── GET /api/bills/stats ───────────────────────────────────────────────────────
router.get('/stats', requireAuth, requireBusiness, async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId!;
    const [total, pending, reviewed, approved, totalAmount] = await Promise.all([
      prisma.bill.count({ where: { businessId } }),
      prisma.bill.count({ where: { businessId, status: 'pending' } }),
      prisma.bill.count({ where: { businessId, status: 'reviewed' } }),
      prisma.bill.count({ where: { businessId, status: 'approved' } }),
      prisma.bill.aggregate({ where: { businessId }, _sum: { totalAmount: true }, _avg: { confidence: true } }),
    ]);

    return res.json({
      total,
      pending,
      reviewed,
      approved,
      totalRevenue: totalAmount._sum.totalAmount ?? 0,
      avgConfidence: totalAmount._avg.confidence ?? 0,
    });
  } catch (err) {
    console.error('[bills/stats]', err);
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ── GET /api/bills/:id ────────────────────────────────────────────────────────
router.get('/:id', requireAuth, requireBusiness, async (req: AuthRequest, res: Response) => {
  try {
    const bill = await prisma.bill.findFirst({
      where: { id: req.params.id, businessId: req.user!.businessId! },
      include: { items: true, customer: true, corrections: { orderBy: { createdAt: 'desc' } }, processingJob: true },
    });
    if (!bill) return res.status(404).json({ error: 'Bill not found' });
    return res.json(bill);
  } catch (err) {
    console.error('[bills/get]', err);
    return res.status(500).json({ error: 'Failed to fetch bill' });
  }
});

// ── POST /api/bills/capture ───────────────────────────────────────────────────
router.post('/capture', requireAuth, requireBusiness, upload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    const language = (req.body.language as string) || 'en';
    let imageUrl: string | null = null;
    let extraction;

    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
      extraction = await extractBillFromImage(req.file.path, req.file.originalname, language);
    } else {
      // Voice-only or manual entry
      extraction = {
        billNumber: null, billDate: null, vendorName: null, vendorPhone: null,
        subtotal: null, taxAmount: null, totalAmount: null, notes: 'Manual entry — no image provided.',
        language, confidence: 0, rawText: '', items: [], provider: 'none', isDemo: false,
      };
    }

    const bill = await prisma.bill.create({
      data: {
        businessId: req.user!.businessId!,
        userId: req.user!.userId,
        imageUrl,
        captureMode: req.file ? 'upload' : 'manual',
        language,
        rawText: extraction.rawText,
        billNumber: extraction.billNumber,
        billDate: extraction.billDate,
        vendorName: extraction.vendorName,
        vendorPhone: extraction.vendorPhone,
        subtotal: extraction.subtotal,
        taxAmount: extraction.taxAmount,
        totalAmount: extraction.totalAmount,
        notes: extraction.notes,
        confidence: extraction.confidence,
        status: 'extracted',
        items: {
          create: extraction.items.map(item => ({
            rawDescription: item.rawDescription,
            normalizedName: item.normalizedName,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            confidence: item.confidence,
          })),
        },
        processingJob: {
          create: {
            status: 'done',
            provider: extraction.provider,
            completedAt: new Date(),
            startedAt: new Date(),
          },
        },
      },
      include: { items: true, processingJob: true },
    });

    return res.status(201).json({
      bill,
      extraction: { isDemo: extraction.isDemo, provider: extraction.provider },
    });
  } catch (err: any) {
    console.error('[bills/capture]', err);
    return res.status(500).json({ error: err.message || 'Bill capture failed' });
  }
});

// ── PUT /api/bills/:id/review ──────────────────────────────────────────────────
const ReviewSchema = z.object({
  billNumber: z.string().optional().nullable(),
  billDate: z.string().optional().nullable(),
  vendorName: z.string().optional().nullable(),
  subtotal: z.number().optional().nullable(),
  taxAmount: z.number().optional().nullable(),
  totalAmount: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
  customerId: z.string().optional().nullable(),
  items: z.array(z.object({
    id: z.string().optional(),
    rawDescription: z.string(),
    normalizedName: z.string().optional().nullable(),
    quantity: z.number(),
    unit: z.string().optional().nullable(),
    unitPrice: z.number().optional().nullable(),
    totalPrice: z.number().optional().nullable(),
  })).optional(),
});

router.put('/:id/review', requireAuth, requireBusiness, async (req: AuthRequest, res: Response) => {
  const parse = ReviewSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'Validation failed', details: parse.error.flatten() });

  try {
    const bill = await prisma.bill.findFirst({
      where: { id: req.params.id, businessId: req.user!.businessId! },
    });
    if (!bill) return res.status(404).json({ error: 'Bill not found' });

    const { items, ...fields } = parse.data;

    const updated = await prisma.bill.update({
      where: { id: req.params.id },
      data: {
        ...fields,
        status: 'reviewed',
        updatedAt: new Date(),
      },
    });

    // Update items if provided
    if (items) {
      await prisma.billItem.deleteMany({ where: { billId: req.params.id } });
      if (items.length > 0) {
        await prisma.billItem.createMany({
          data: items.map(item => ({
            billId: req.params.id,
            rawDescription: item.rawDescription,
            normalizedName: item.normalizedName ?? null,
            quantity: item.quantity,
            unit: item.unit ?? null,
            unitPrice: item.unitPrice ?? null,
            totalPrice: item.totalPrice ?? null,
            isEdited: true,
            confidence: 1.0,
          })),
        });
      }
    }

    // Log correction
    await prisma.correction.create({
      data: {
        billId: req.params.id,
        userId: req.user!.userId,
        fieldName: 'review',
        originalValue: 'extracted',
        correctedValue: 'reviewed',
        source: 'manual',
      },
    });

    return res.json(updated);
  } catch (err) {
    console.error('[bills/review]', err);
    return res.status(500).json({ error: 'Review save failed' });
  }
});

// ── POST /api/bills/voice ──────────────────────────────────────────────────────
router.post('/voice', requireAuth, requireBusiness, async (req: AuthRequest, res: Response) => {
  const { transcript, language = 'en', billId } = req.body;
  if (!transcript) return res.status(400).json({ error: 'Transcript is required' });

  try {
    const parsed = parseVoiceCommand(transcript, language);

    // If bill ID provided, log correction
    if (billId && parsed.action !== 'unknown') {
      await prisma.correction.create({
        data: {
          billId,
          userId: req.user!.userId,
          fieldName: parsed.fieldName || parsed.action,
          correctedValue: parsed.value || parsed.itemDescription || '',
          source: 'voice',
        },
      });
    }

    return res.json({ parsed, isDemo: parsed.isDemo });
  } catch (err) {
    console.error('[bills/voice]', err);
    return res.status(500).json({ error: 'Voice parsing failed' });
  }
});

// ── PATCH /api/bills/:id/approve ──────────────────────────────────────────────
router.patch('/:id/approve', requireAuth, requireBusiness, async (req: AuthRequest, res: Response) => {
  try {
    const bill = await prisma.bill.findFirst({
      where: { id: req.params.id, businessId: req.user!.businessId! },
    });
    if (!bill) return res.status(404).json({ error: 'Bill not found' });

    const updated = await prisma.bill.update({
      where: { id: req.params.id },
      data: { status: 'approved' },
    });
    return res.json(updated);
  } catch (err) {
    console.error('[bills/approve]', err);
    return res.status(500).json({ error: 'Approval failed' });
  }
});

// ── DELETE /api/bills/:id ─────────────────────────────────────────────────────
router.delete('/:id', requireAuth, requireBusiness, async (req: AuthRequest, res: Response) => {
  try {
    const bill = await prisma.bill.findFirst({
      where: { id: req.params.id, businessId: req.user!.businessId! },
    });
    if (!bill) return res.status(404).json({ error: 'Bill not found' });

    await prisma.bill.delete({ where: { id: req.params.id } });

    // Clean up uploaded file if exists
    if (bill.imageUrl) {
      const filePath = bill.imageUrl.replace('/uploads/', 'uploads/');
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    return res.json({ deleted: true });
  } catch (err) {
    console.error('[bills/delete]', err);
    return res.status(500).json({ error: 'Delete failed' });
  }
});

export default router;
