/**
 * BahiVerse AI — Language & Script Detection Service
 * Supports English, Hindi (Devanagari), and Punjabi (Gurmukhi)
 */
export type SupportedLanguage = 'en' | 'hi' | 'pa';

export function detectScript(text: string): SupportedLanguage {
  // Gurmukhi Unicode Range: \u0A00-\u0A7F
  const gurmukhiRegex = /[\u0A00-\u0A7F]/;
  // Devanagari Unicode Range: \u0900-\u097F
  const devanagariRegex = /[\u0900-\u097F]/;

  if (gurmukhiRegex.test(text)) return 'pa';
  if (devanagariRegex.test(text)) return 'hi';
  return 'en';
}

export function normalizePhoneticTerm(term: string): string {
  return term
    .toLowerCase()
    .trim()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
    .replace(/\s+/g, ' ');
}
