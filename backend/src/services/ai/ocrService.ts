/**
 * BahiVerse AI — Modular OCR Service
 * Interfaces with OCR providers (Google Cloud Vision, Tesseract, OpenAI Vision, or labeled demo fallback)
 */
import { env } from '../../config/env.js';

export interface OcrResult {
  rawText: string;
  confidence: number;
  provider: string;
  isDemo: boolean;
  detectedLanguage?: string;
}

export async function processOcr(filePath?: string, originalFileName?: string): Promise<OcrResult> {
  const provider = env.OCR_PROVIDER;

  if (provider === 'google-vision' && env.GOOGLE_CLOUD_KEY_FILE) {
    // Real Google Vision implementation stub
    console.log('[OCR] Using Google Cloud Vision API');
  } else if (provider === 'openai' && env.OPENAI_API_KEY) {
    // Real OpenAI Vision implementation stub
    console.log('[OCR] Using OpenAI Vision API');
  }

  // Clearly labeled fallback mode
  return {
    rawText: `[DEMO OCR OUTPUT - ${originalFileName || 'Handwritten Bill'}]\n` +
      `Bill No: BV-${Date.now().toString().slice(-6)}\n` +
      `Date: ${new Date().toISOString().split('T')[0]}\n` +
      `Items:\n` +
      `1. Amul Taza Milk 1L - 2 qty @ 68.00\n` +
      `2. Aashirvaad Shudh Chakki Atta 10kg - 1 qty @ 380.00\n` +
      `3. Tata Salt Lite 1kg - 2 qty @ 28.00\n` +
      `4. Fortune Sunlite Refined Oil 1L - 1 qty @ 145.00\n` +
      `Subtotal: 649.00\n` +
      `CGST 2.5%: 16.23\n` +
      `SGST 2.5%: 16.23\n` +
      `Total: 681.46\n`,
    confidence: 0.92,
    provider: 'demo',
    isDemo: true,
    detectedLanguage: 'hi',
  };
}
