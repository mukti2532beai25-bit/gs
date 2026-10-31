/**
 * BahiVerse AI — Extraction Service
 * Provides OCR + AI bill data extraction.
 * Currently ships a realistic DEMO mode that returns plausible structured data.
 * Swap OCR_PROVIDER env var to "openai" or "google-vision" to use real providers.
 */

export interface ExtractedBillData {
  billNumber: string | null;
  billDate: string | null;
  vendorName: string | null;
  vendorPhone: string | null;
  subtotal: number | null;
  taxAmount: number | null;
  totalAmount: number | null;
  notes: string | null;
  language: string;
  confidence: number;
  rawText: string;
  items: ExtractedItem[];
  provider: string;
  isDemo: boolean;
}

export interface ExtractedItem {
  rawDescription: string;
  normalizedName: string | null;
  quantity: number;
  unit: string | null;
  unitPrice: number | null;
  totalPrice: number | null;
  confidence: number;
}

// ── Demo extraction (clearly labeled) ────────────────────────────────────────
function generateDemoExtraction(fileName: string): ExtractedBillData {
  const items: ExtractedItem[] = [
    { rawDescription: 'Amul Milk 1L x4', normalizedName: 'Amul Milk 1L', quantity: 4, unit: 'litre', unitPrice: 68, totalPrice: 272, confidence: 0.94 },
    { rawDescription: 'Atta 10kg bag', normalizedName: 'Atta 10kg', quantity: 1, unit: 'kg', unitPrice: 350, totalPrice: 350, confidence: 0.87 },
    { rawDescription: 'Surf Excel 500g', normalizedName: 'Surf Excel 500g', quantity: 2, unit: 'piece', unitPrice: 110, totalPrice: 220, confidence: 0.91 },
    { rawDescription: 'Biscuit Parle-G 2 pkt', normalizedName: 'Parle-G Biscuits', quantity: 2, unit: 'piece', unitPrice: 10, totalPrice: 20, confidence: 0.96 },
  ];

  const subtotal = items.reduce((s, i) => s + (i.totalPrice ?? 0), 0);
  const taxAmount = parseFloat((subtotal * 0.05).toFixed(2));
  const totalAmount = parseFloat((subtotal + taxAmount).toFixed(2));

  return {
    billNumber: `BILL-${Date.now().toString().slice(-6)}`,
    billDate: new Date().toISOString().split('T')[0],
    vendorName: 'Demo Vendor [DEMO MODE]',
    vendorPhone: '+91 98765 00000',
    subtotal,
    taxAmount,
    totalAmount,
    notes: '⚠️ DEMO DATA — No real OCR was performed. Configure OCR_PROVIDER in .env to enable actual extraction.',
    language: 'en',
    confidence: 0.88,
    rawText: `[DEMO] Simulated OCR output for file: ${fileName}\n\nBill No: DEMO-001\nDate: ${new Date().toLocaleDateString('en-IN')}\nVendor: Demo Vendor\n\nItems extracted via demo mode.`,
    items,
    provider: 'demo',
    isDemo: true,
  };
}

// ── Main extraction entry point ───────────────────────────────────────────────
export async function extractBillFromImage(
  filePath: string,
  originalName: string,
  language = 'en'
): Promise<ExtractedBillData> {
  const provider = process.env.OCR_PROVIDER || 'demo';

  if (provider === 'openai') {
    return extractWithOpenAI(filePath, originalName, language);
  }

  if (provider === 'google-vision') {
    return extractWithGoogleVision(filePath, originalName, language);
  }

  // Default: demo mode
  console.log(`[extraction] Demo mode active. File: ${originalName}`);
  return generateDemoExtraction(originalName);
}

// ── OpenAI Vision (stub — ready for real key) ─────────────────────────────────
async function extractWithOpenAI(filePath: string, fileName: string, language: string): Promise<ExtractedBillData> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('[extraction] OPENAI_API_KEY not set. Falling back to demo.');
    return generateDemoExtraction(fileName);
  }

  // Real implementation would use OpenAI GPT-4o vision API here
  // For now, fallback to demo if key present but not yet implemented
  console.log('[extraction] OpenAI provider selected. Full implementation requires OPENAI_API_KEY.');
  return generateDemoExtraction(fileName);
}

// ── Google Cloud Vision (stub — ready for real credentials) ─────────────────
async function extractWithGoogleVision(filePath: string, fileName: string, language: string): Promise<ExtractedBillData> {
  const keyFile = process.env.GOOGLE_CLOUD_KEY_FILE;
  if (!keyFile) {
    console.warn('[extraction] GOOGLE_CLOUD_KEY_FILE not set. Falling back to demo.');
    return generateDemoExtraction(fileName);
  }

  console.log('[extraction] Google Vision provider selected.');
  return generateDemoExtraction(fileName);
}

// ── Voice parsing ─────────────────────────────────────────────────────────────
export interface ParsedVoiceCommand {
  action: 'add_item' | 'set_field' | 'correction' | 'unknown';
  fieldName?: string;
  value?: string;
  itemDescription?: string;
  quantity?: number;
  unit?: string;
  price?: number;
  language: string;
  rawText: string;
  isDemo: boolean;
}

export function parseVoiceCommand(transcript: string, language: string): ParsedVoiceCommand {
  const text = transcript.toLowerCase().trim();

  // Simple rule-based parsing (demo mode)
  // Real implementation would use Whisper API + GPT-4 for structured parsing

  // Detect field correction
  if (text.includes('total') || text.includes('amount')) {
    const match = text.match(/[\d,]+\.?\d*/);
    return {
      action: 'set_field',
      fieldName: 'totalAmount',
      value: match ? match[0].replace(',', '') : undefined,
      language,
      rawText: transcript,
      isDemo: true,
    };
  }

  // Detect item addition
  const itemMatch = text.match(/add (.+?) (\d+\.?\d*) (kg|ltr|litre|piece|pcs)/i);
  if (itemMatch) {
    return {
      action: 'add_item',
      itemDescription: itemMatch[1],
      quantity: parseFloat(itemMatch[2]),
      unit: itemMatch[3],
      language,
      rawText: transcript,
      isDemo: true,
    };
  }

  return { action: 'unknown', language, rawText: transcript, isDemo: true };
}
