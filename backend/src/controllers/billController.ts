import { Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { updateBillReviewSchema } from '../validators/billValidators.js';
import { extractBillData } from '../services/ai/extractionService.js';

export async function listBills(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const businessId = req.user!.businessId!;
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '20', 10);
    const status = req.query.status as string | undefined;

    const where: any = { businessId };
    if (status) where.status = status;

    const [bills, total] = await Promise.all([
      prisma.bill.findMany({
        where,
        include: {
          customer: true,
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.bill.count({ where }),
    ]);

    res.json({
      success: true,
      data: bills,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getBillStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const businessId = req.user!.businessId!;

    const [total, pending, reviewed, approved, totalCustomers, totalProducts, aggregates, recentCorrections] = await Promise.all([
      prisma.bill.count({ where: { businessId } }),
      prisma.bill.count({ where: { businessId, status: 'pending' } }),
      prisma.bill.count({ where: { businessId, status: 'reviewed' } }),
      prisma.bill.count({ where: { businessId, status: 'approved' } }),
      prisma.customer.count({ where: { businessId } }),
      prisma.product.count({ where: { businessId } }),
      prisma.bill.aggregate({
        where: { businessId },
        _sum: { totalAmount: true },
        _avg: { confidence: true },
      }),
      prisma.correction.findMany({
        where: { bill: { businessId } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { bill: { select: { billNumber: true, vendorName: true } } },
      }),
    ]);

    const processed = reviewed + approved;

    res.json({
      success: true,
      data: {
        total,
        processed,
        pending,
        reviewed,
        approved,
        totalCustomers,
        totalProducts,
        totalRevenue: aggregates._sum.totalAmount || 0,
        avgConfidence: aggregates._avg.confidence || 0,
        recentActivity: recentCorrections.map((c) => ({
          id: c.id,
          action: `Corrected ${c.fieldName} via ${c.source}`,
          billRef: c.bill.billNumber || c.bill.vendorName || 'Bill',
          time: c.createdAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getBillById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const businessId = req.user!.businessId!;

    const bill = await prisma.bill.findFirst({
      where: { id, businessId },
      include: {
        items: true,
        customer: true,
        corrections: { orderBy: { createdAt: 'desc' } },
        processingJob: true,
      },
    });

    if (!bill) {
      res.status(404).json({ success: false, error: 'Bill record not found.' });
      return;
    }

    res.json({ success: true, data: bill });
  } catch (error) {
    next(error);
  }
}

export async function captureBill(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const businessId = req.user!.businessId!;
    const userId = req.user!.userId;
    const targetLang = (req.body.language as string) || 'hi';

    const file = req.file;
    const extraction = await extractBillData(
      businessId,
      file?.path,
      file?.originalname,
      targetLang
    );

    let customerId: string | null = null;
    if (extraction.customerName) {
      const existingCustomer = await prisma.customer.findFirst({
        where: { businessId, name: extraction.customerName },
      });
      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        const newCustomer = await prisma.customer.create({
          data: {
            businessId,
            name: extraction.customerName,
            phone: extraction.customerPhone || null,
          },
        });
        customerId = newCustomer.id;
      }
    }

    const bill = await prisma.bill.create({
      data: {
        businessId,
        userId,
        customerId,
        imageUrl: file ? `/uploads/${file.filename}` : null,
        captureMode: file ? 'upload' : 'manual',
        language: targetLang,
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
          create: extraction.items.map((item) => ({
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
          },
        },
      },
      include: {
        items: true,
        processingJob: true,
      },
    });

    res.status(201).json({
      success: true,
      data: bill,
      meta: {
        isDemo: extraction.isDemo,
        provider: extraction.provider,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateBillReview(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const businessId = req.user!.businessId!;
    const input = updateBillReviewSchema.parse(req.body);

    const existingBill = await prisma.bill.findFirst({
      where: { id, businessId },
    });

    if (!existingBill) {
      res.status(404).json({ success: false, error: 'Bill record not found.' });
      return;
    }

    const { items, customerName, customerPhone, newVocabTerms, ...headerFields } = input;

    let customerId = existingBill.customerId;
    if (customerName) {
      const customer = await prisma.customer.findFirst({
        where: { businessId, name: customerName },
      });
      if (customer) {
        customerId = customer.id;
        if (customerPhone && customer.phone !== customerPhone) {
          await prisma.customer.update({ where: { id: customer.id }, data: { phone: customerPhone } });
        }
      } else {
        const newCust = await prisma.customer.create({
          data: { businessId, name: customerName, phone: customerPhone || null },
        });
        customerId = newCust.id;
      }
    }

    const updated = await prisma.bill.update({
      where: { id },
      data: {
        ...headerFields,
        customerId,
        status: 'reviewed',
      },
      include: {
        customer: true,
      },
    });

    if (items) {
      await prisma.billItem.deleteMany({ where: { billId: id } });
      if (items.length > 0) {
        await prisma.billItem.createMany({
          data: items.map((i) => ({
            billId: id,
            rawDescription: i.rawDescription,
            normalizedName: i.normalizedName || null,
            quantity: i.quantity,
            unit: i.unit || null,
            unitPrice: i.unitPrice ?? null,
            totalPrice: i.totalPrice ?? null,
            isEdited: true,
            confidence: 1.0,
          })),
        });
      }
    }

    // Save new vocabulary mappings if approved during review
    if (newVocabTerms && newVocabTerms.length > 0) {
      for (const vocab of newVocabTerms) {
        await prisma.vocabularyMapping.upsert({
          where: {
            businessId_rawTerm: {
              businessId,
              rawTerm: vocab.rawTerm,
            },
          },
          update: {
            normalizedTerm: vocab.normalizedTerm,
            category: vocab.category,
          },
          create: {
            businessId,
            rawTerm: vocab.rawTerm,
            normalizedTerm: vocab.normalizedTerm,
            category: vocab.category,
            language: existingBill.language,
          },
        });
      }
    }

    // Log correction record in audit trail
    await prisma.correction.create({
      data: {
        billId: id,
        userId: req.user!.userId,
        fieldName: 'bill_review_correction',
        originalValue: `Status: ${existingBill.status}, Total: ${existingBill.totalAmount}`,
        correctedValue: `Status: reviewed, Total: ${updated.totalAmount}, Items: ${items?.length ?? 0}`,
        source: 'manual',
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
}

export async function approveBill(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const businessId = req.user!.businessId!;

    const bill = await prisma.bill.findFirst({ where: { id, businessId } });
    if (!bill) {
      res.status(404).json({ success: false, error: 'Bill record not found.' });
      return;
    }

    const updated = await prisma.bill.update({
      where: { id },
      data: { status: 'approved' },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
}

export async function deleteBill(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const businessId = req.user!.businessId!;

    const bill = await prisma.bill.findFirst({ where: { id, businessId } });
    if (!bill) {
      res.status(404).json({ success: false, error: 'Bill record not found.' });
      return;
    }

    await prisma.bill.delete({ where: { id } });
    res.json({ success: true, message: 'Bill deleted successfully.' });
  } catch (error) {
    next(error);
  }
}
