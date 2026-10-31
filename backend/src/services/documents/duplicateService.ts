import crypto from 'crypto';

export interface DocumentMetadata {
  invoiceNumber?: string;
  vendorName?: string;
  customerName?: string;
  billDate?: string;
  totalAmount?: number;
}

export interface DuplicateCheckCandidate {
  id: string;
  fileHash?: string;
  billNumber?: string;
  vendorName?: string;
  customerName?: string;
  billDate?: string;
  totalAmount?: number;
}

export interface DuplicateDetectionResult {
  isDuplicate: boolean;
  confidence: number;
  reason: string;
  matchedId?: string;
  duplicateType?: 'exact_hash' | 'invoice_number' | 'vendor_date_amount';
}

/**
 * Computes a standard SHA-256 hash of a file buffer.
 */
export function calculateFileHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Normalizes text strings for robust duplicate comparison.
 */
function normalizeString(val?: string | null): string {
  if (!val) return '';
  return val.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Evaluates duplicate probability across multiple confidence vectors:
 * 1. Exact SHA-256 hash match -> 100% confidence.
 * 2. Exact Invoice Number match for the same vendor/business -> 95% confidence.
 * 3. Same vendor + same date + same total amount -> 90% confidence.
 */
export function detectDuplicate(
  newHash: string | undefined,
  newMeta: DocumentMetadata,
  existingList: DuplicateCheckCandidate[]
): DuplicateDetectionResult {
  // Vector 1: Exact File Hash Match
  if (newHash) {
    const hashMatch = existingList.find(
      (c) => c.fileHash && c.fileHash.toLowerCase() === newHash.toLowerCase()
    );
    if (hashMatch) {
      return {
        isDuplicate: true,
        confidence: 1.0,
        reason: 'Identical file content detected (SHA-256 hash match).',
        matchedId: hashMatch.id,
        duplicateType: 'exact_hash',
      };
    }
  }

  const normNewInvoice = normalizeString(newMeta.invoiceNumber);
  const normNewVendor = normalizeString(newMeta.vendorName || newMeta.customerName);
  const newDate = newMeta.billDate?.trim();
  const newAmount = typeof newMeta.totalAmount === 'number' ? Math.round(newMeta.totalAmount * 100) / 100 : null;

  for (const candidate of existingList) {
    const normCandInvoice = normalizeString(candidate.billNumber);
    const normCandVendor = normalizeString(candidate.vendorName || candidate.customerName);
    const candDate = candidate.billDate?.trim();
    const candAmount = typeof candidate.totalAmount === 'number' ? Math.round(candidate.totalAmount * 100) / 100 : null;

    // Vector 2: Exact Invoice Number match
    if (normNewInvoice && normCandInvoice && normNewInvoice === normCandInvoice) {
      // If vendor also matches, 98% confidence
      if (normNewVendor && normCandVendor && normNewVendor === normCandVendor) {
        return {
          isDuplicate: true,
          confidence: 0.98,
          reason: `Matching invoice number '${newMeta.invoiceNumber}' and supplier '${candidate.vendorName || candidate.billNumber}' already exists.`,
          matchedId: candidate.id,
          duplicateType: 'invoice_number',
        };
      }
      return {
        isDuplicate: true,
        confidence: 0.92,
        reason: `Matching invoice number '${newMeta.invoiceNumber}' found in existing records.`,
        matchedId: candidate.id,
        duplicateType: 'invoice_number',
      };
    }

    // Vector 3: Same Vendor + Same Date + Same Total Amount
    if (
      normNewVendor &&
      normCandVendor &&
      normNewVendor === normCandVendor &&
      newDate &&
      candDate &&
      newDate === candDate &&
      newAmount !== null &&
      candAmount !== null &&
      Math.abs(newAmount - candAmount) < 0.01
    ) {
      return {
        isDuplicate: true,
        confidence: 0.89,
        reason: `Identical supplier ('${candidate.vendorName}'), date ('${newDate}'), and total amount (₹${newAmount}) match an existing bill.`,
        matchedId: candidate.id,
        duplicateType: 'vendor_date_amount',
      };
    }
  }

  return {
    isDuplicate: false,
    confidence: 0,
    reason: 'No duplicate detected. File and metadata are unique.',
  };
}
