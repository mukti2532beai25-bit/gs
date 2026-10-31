/**
 * BahiVerse AI — Voice Command Parsing Service
 * Structures spoken commands in Hindi, Punjabi, and English into structured actions
 */
export interface ParsedVoiceAction {
  action: 'add_item' | 'update_total' | 'set_vendor' | 'set_customer' | 'general_correction';
  productName?: string;
  quantity?: number;
  unit?: string;
  price?: number;
  fieldName?: string;
  fieldValue?: string;
  rawTranscript: string;
  language: string;
}

export function parseVoiceInput(transcript: string, language: string = 'hi'): ParsedVoiceAction {
  const clean = transcript.toLowerCase().trim();

  // Pattern: "add [item] [quantity] [unit]" or "जोड़ो [item]"
  const addMatch = clean.match(/(?:add|जोड़ो|paao)\s+(.+?)\s+(\d+(?:\.\d+)?)\s*(kg|ltr|litre|piece|pcs|packet|bori)?/i);
  if (addMatch) {
    return {
      action: 'add_item',
      productName: addMatch[1].trim(),
      quantity: parseFloat(addMatch[2]),
      unit: addMatch[3] || 'piece',
      rawTranscript: transcript,
      language,
    };
  }

  // Pattern: "total [number]" or "कुल रकम [number]"
  const totalMatch = clean.match(/(?:total|कुल रकम|amount)\s+(?:is|to|karo|hai)?\s*(\d+(?:\.\d+)?)/i);
  if (totalMatch) {
    return {
      action: 'update_total',
      fieldName: 'totalAmount',
      fieldValue: totalMatch[1],
      price: parseFloat(totalMatch[1]),
      rawTranscript: transcript,
      language,
    };
  }

  // Default: general correction fallback
  return {
    action: 'general_correction',
    rawTranscript: transcript,
    language,
  };
}
