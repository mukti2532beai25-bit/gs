import { Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { exportRequestSchema } from '../validators/vocabValidators.js';

export async function generateExport(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const businessId = req.user!.businessId!;
    const userId = req.user!.userId;
    const input = exportRequestSchema.parse(req.body);

    const where: any = { businessId };
    if (input.allApproved) {
      where.status = 'approved';
    }
    if (input.billIds && input.billIds.length > 0) {
      where.id = { in: input.billIds };
    }
    if (input.dateFrom) {
      where.createdAt = { gte: new Date(input.dateFrom) };
    }
    if (input.dateTo) {
      where.createdAt = { ...(where.createdAt || {}), lte: new Date(input.dateTo) };
    }

    const bills = await prisma.bill.findMany({
      where,
      include: {
        items: true,
        customer: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

    if (input.format === 'csv') {
      const headers = ['Bill Number', 'Date', 'Vendor', 'Customer', 'Status', 'Subtotal', 'Tax', 'Total', 'Items Count'];
      const rows = bills.map((b) => [
        `"${b.billNumber || b.id}"`,
        `"${b.billDate || ''}"`,
        `"${b.vendorName || ''}"`,
        `"${b.customer?.name || ''}"`,
        `"${b.status}"`,
        `"${b.subtotal || 0}"`,
        `"${b.taxAmount || 0}"`,
        `"${b.totalAmount || 0}"`,
        `"${b.items.length}"`,
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const fileName = `bahiverse-ledger-${timestamp}.csv`;

      await prisma.exportRecord.create({
        data: {
          businessId,
          userId,
          format: 'csv',
          fileName,
          billCount: bills.length,
        },
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(csvContent);
      return;
    }

    if (input.format === 'json') {
      const fileName = `bahiverse-export-${timestamp}.json`;
      const exportJson = {
        meta: {
          exportedAt: new Date().toISOString(),
          totalRecords: bills.length,
          format: 'BahiVerse-Accounting-JSON-v1',
        },
        records: bills,
      };

      await prisma.exportRecord.create({
        data: {
          businessId,
          userId,
          format: 'json',
          fileName,
          billCount: bills.length,
        },
      });

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(JSON.stringify(exportJson, null, 2));
      return;
    }

    if (input.format === 'tally-xml') {
      const fileName = `bahiverse-tally-${timestamp}.xml`;
      const vouchers = bills
        .map(
          (b) => `    <VOUCHER VCHTYPE="Sales" ACTION="Create">
      <DATE>${(b.billDate || new Date().toISOString().split('T')[0]).replace(/-/g, '')}</DATE>
      <VOUCHERNUMBER>${b.billNumber || b.id.slice(0, 8)}</VOUCHERNUMBER>
      <PARTYLEDGERNAME>${b.customer?.name || 'Cash Sales'}</PARTYLEDGERNAME>
      <AMOUNT>${b.totalAmount || 0}</AMOUNT>
    </VOUCHER>`
        )
        .join('\n');

      const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC><REPORTNAME>Vouchers</REPORTNAME></REQUESTDESC>
      <REQUESTDATA>
${vouchers}
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;

      await prisma.exportRecord.create({
        data: {
          businessId,
          userId,
          format: 'tally-xml',
          fileName,
          billCount: bills.length,
        },
      });

      res.setHeader('Content-Type', 'application/xml');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(xmlContent);
      return;
    }

    res.status(400).json({ success: false, error: 'Unsupported format' });
  } catch (error) {
    next(error);
  }
}

export async function getExportHistory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const businessId = req.user!.businessId!;
    const history = await prisma.exportRecord.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
}
