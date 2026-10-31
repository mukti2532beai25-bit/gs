/**
 * BahiVerse AI — Comprehensive Voice Command NLP Parsing Engine
 * Multi-lingual parser supporting Hindi, Punjabi, and English shopkeeper speech
 */
export type VoiceActionType =
  | 'correct_quantity'
  | 'correct_price'
  | 'add_item'
  | 'set_customer'
  | 'correct_date'
  | 'update_total'
  | 'ambiguous';

export interface ParsedVoiceAction {
  action: VoiceActionType;
  targetField: string;
  productName?: string;
  quantity?: number;
  unit?: string;
  price?: number;
  requestedChange: string;
  confidence: number;
  requiresConfirmation: boolean;
  isAmbiguous: boolean;
  clarificationPrompt?: string;
  rawTranscript: string;
  language: string;
}

export function parseVoiceInput(transcript: string, language: string = 'hi'): ParsedVoiceAction {
  const clean = transcript.toLowerCase().trim();

  // 1. Correct Quantity: "Correct the quantity of [product] to [number]" / "[product] ki quantity [number] karo" / "मात्रा [number] करो"
  const qtyMatch = clean.match(
    /(?:correct\s+(?:the\s+)?quantity\s+of|change\s+quantity\s+of|quantity\s+of|मात्रा|gintee)\s+(.+?)\s+(?:to|ko|karo|hai)?\s*(\d+(?:\.\d+)?)/i
  ) || clean.match(/(.+?)\s+(?:ki\s+)?(?:quantity|मात्रा)\s*(\d+(?:\.\d+)?)\s*(?:karo|kar do)?/i);

  if (qtyMatch) {
    const prod = qtyMatch[1].replace(/^(the|item|product)\s+/i, '').trim();
    const qty = parseFloat(qtyMatch[2]);
    return {
      action: 'correct_quantity',
      targetField: 'quantity',
      productName: prod,
      quantity: qty,
      requestedChange: `Set quantity of "${prod}" to ${qty}`,
      confidence: 0.94,
      requiresConfirmation: false,
      isAmbiguous: false,
      rawTranscript: transcript,
      language,
    };
  }

  // 2. Change Price: "Change the price of [product] to [number]" / "भाव [number] करो" / "rate [number]"
  const priceMatch = clean.match(
    /(?:change\s+(?:the\s+)?price\s+of|correct\s+price\s+of|price\s+of|rate\s+of|bhaav|keemat)\s+(.+?)\s+(?:to|ko|karo|hai)?\s*(?:rs|₹|rupees)?\s*(\d+(?:\.\d+)?)/i
  ) || clean.match(/(.+?)\s+(?:ka\s+)?(?:price|rate|bhaav|भाव)\s*(?:rs|₹)?\s*(\d+(?:\.\d+)?)\s*(?:karo|kar do)?/i);

  if (priceMatch) {
    const prod = priceMatch[1].replace(/^(the|item|product)\s+/i, '').trim();
    const price = parseFloat(priceMatch[2]);
    return {
      action: 'correct_price',
      targetField: 'unitPrice',
      productName: prod,
      price,
      requestedChange: `Set unit price of "${prod}" to ₹${price.toFixed(2)}`,
      confidence: 0.95,
      requiresConfirmation: true, // Price changes always require merchant confirmation
      isAmbiguous: false,
      rawTranscript: transcript,
      language,
    };
  }

  // 3. Add Item: "Add [number] [unit?] [product]" / "[number] [product] जोड़ो" / "paao"
  const addMatch = clean.match(
    /(?:add|जोड़ो|paao|likho)\s+(\d+(?:\.\d+)?)\s*(kg|ltr|litre|piece|pcs|packet|bori|notebooks?|books?)?\s*(?:of\s+)?(.+)/i
  ) || clean.match(/(?:add|जोड़ो)\s+(.+?)\s+(\d+(?:\.\d+)?)\s*(kg|ltr|litre|piece|pcs|packet|bori)?/i);

  if (addMatch) {
    let qty = 1;
    let unit = 'piece';
    let prod = '';

    if (isNaN(parseFloat(addMatch[1]))) {
      prod = addMatch[1].trim();
      qty = parseFloat(addMatch[2]) || 1;
      unit = addMatch[3] || 'piece';
    } else {
      qty = parseFloat(addMatch[1]);
      unit = addMatch[2] || 'piece';
      prod = addMatch[3] ? addMatch[3].trim() : 'Product';
    }

    return {
      action: 'add_item',
      targetField: 'items',
      productName: prod,
      quantity: qty,
      unit,
      requestedChange: `Add ${qty} ${unit} of "${prod}"`,
      confidence: 0.96,
      requiresConfirmation: false,
      isAmbiguous: false,
      rawTranscript: transcript,
      language,
    };
  }

  // 4. Change Customer Name: "Change customer name to [name]" / "customer [name] karo" / "grahak [name]"
  const customerMatch = clean.match(
    /(?:change\s+(?:the\s+)?customer\s+(?:name\s+)?to|customer\s+name\s+is|customer\s+hai|grahak\s+ka\s+naam)\s+(.+)/i
  );
  if (customerMatch) {
    const custName = customerMatch[1].replace(/(?:karo|kar do|hai)$/i, '').trim();
    return {
      action: 'set_customer',
      targetField: 'customerName',
      requestedChange: `Set customer name to "${custName}"`,
      confidence: 0.92,
      requiresConfirmation: true,
      isAmbiguous: false,
      rawTranscript: transcript,
      language,
    };
  }

  // 5. Correct Bill Date: "Correct the bill date to [date]" / "date [date] karo" / "tareekh [date]"
  const dateMatch = clean.match(
    /(?:correct\s+(?:the\s+)?(?:bill\s+)?date\s+to|date\s+is|tareekh|tithi)\s+(.+)/i
  );
  if (dateMatch) {
    const dateVal = dateMatch[1].replace(/(?:karo|kar do|hai)$/i, '').trim();
    return {
      action: 'correct_date',
      targetField: 'billDate',
      requestedChange: `Set bill date to "${dateVal}"`,
      confidence: 0.93,
      requiresConfirmation: true,
      isAmbiguous: false,
      rawTranscript: transcript,
      language,
    };
  }

  // 6. Ambiguous command protection (safety requirement)
  return {
    action: 'ambiguous',
    targetField: 'unknown',
    requestedChange: 'Unrecognized action',
    confidence: 0.45,
    requiresConfirmation: true,
    isAmbiguous: true,
    clarificationPrompt:
      'The speech command was unclear. Please specify the field (e.g. "quantity of milk to 5", "price of rice to 60", "add 2 notebooks").',
    rawTranscript: transcript,
    language,
  };
}
