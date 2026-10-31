import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import {
  validatePreExport,
  buildCaExcelWorkbook,
  buildCaCsv,
  getOperationalData,
  CA_COMPLIANCE_DISCLAIMER,
  RESPONSIBILITY_BOUNDARIES,
} from '../services/export/caExportService.js';

/**
 * Returns operational data and GSTR preparation summaries for the business.
 */
export async function getCaPreparationData(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const businessId = req.user!.businessId!;
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;

    const data = getOperationalData(businessId, from, to);

    res.json({
      success: true,
      data: {
        ...data,
        disclaimer: CA_COMPLIANCE_DISCLAIMER,
        responsibilityBoundaries: RESPONSIBILITY_BOUNDARIES,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Runs pre-export validation and reconciliation checks.
 */
export async function validateCaExport(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const businessId = req.user!.businessId!;
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;

    const validation = validatePreExport(businessId, from, to);

    res.json({
      success: true,
      data: validation,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Generates and downloads the requested CA export file (multi-sheet Excel, CSV, or JSON).
 */
export async function downloadCaExport(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const businessId = req.user!.businessId!;
    const { format = 'xlsx', registerType = 'all', from, to } = req.body;
    const businessName = 'Kirana Wholesale Hub & Retail';

    if (format === 'xlsx') {
      const buffer = buildCaExcelWorkbook(businessId, businessName, from, to);
      const filename = `BahiVerse_CA_Dossier_${new Date().toISOString().split('T')[0]}.xlsx`;

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
      return;
    }

    if (format === 'csv') {
      const csvType = registerType === 'purchases' ? 'purchases' : registerType === 'expenses' ? 'expenses' : 'sales';
      const csvContent = buildCaCsv(businessId, csvType);
      const filename = `BahiVerse_${csvType}_Register_${new Date().toISOString().split('T')[0]}.csv`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csvContent);
      return;
    }

    // Default JSON
    const data = getOperationalData(businessId, from, to);
    res.json({
      success: true,
      data: {
        exportMetadata: {
          businessId,
          businessName,
          generatedAt: new Date().toISOString(),
          period: { from, to },
          disclaimer: CA_COMPLIANCE_DISCLAIMER,
          boundaries: RESPONSIBILITY_BOUNDARIES,
        },
        ...data,
      },
    });
  } catch (error) {
    next(error);
  }
}
