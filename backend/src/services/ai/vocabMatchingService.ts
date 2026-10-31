/**
 * BahiVerse AI — Shop Vocabulary Matching Service
 * Normalizes colloquial shopkeeper slang against store vocabulary and product records
 */
import { prisma } from '../../config/database.js';
import { normalizePhoneticTerm } from './languageService.js';

export interface MatchResult {
  rawDescription: string;
  normalizedName: string;
  matchedCategory?: string;
  confidence: number;
}

export async function matchVocabulary(
  businessId: string,
  rawDescription: string
): Promise<MatchResult> {
  const normalizedInput = normalizePhoneticTerm(rawDescription);

  try {
    // 1. Check exact or partial match in shop's custom vocabulary
    const vocabMapping = await prisma.vocabularyMapping.findFirst({
      where: {
        businessId,
        rawTerm: {
          contains: normalizedInput,
        },
      },
    });

    if (vocabMapping) {
      // Increment usage count
      await prisma.vocabularyMapping.update({
        where: { id: vocabMapping.id },
        data: { usageCount: { increment: 1 } },
      });

      return {
        rawDescription,
        normalizedName: vocabMapping.normalizedTerm,
        matchedCategory: vocabMapping.category,
        confidence: 0.95,
      };
    }

    // 2. Fallback to product catalog search
    const product = await prisma.product.findFirst({
      where: {
        businessId,
        name: {
          contains: normalizedInput,
        },
      },
    });

    if (product) {
      return {
        rawDescription,
        normalizedName: product.name,
        matchedCategory: product.category || undefined,
        confidence: 0.88,
      };
    }
  } catch {
    // If DB is offline, return graceful heuristic fallback
  }

  // 3. Heuristic clean-up
  return {
    rawDescription,
    normalizedName: rawDescription.trim(),
    confidence: 0.75,
  };
}
