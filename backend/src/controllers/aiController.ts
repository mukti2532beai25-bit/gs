import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import {
  processNaturalLanguageQuery,
  confirmProductWriteAction,
} from '../services/ai/aiQueryService.js';

export async function handleAiQuery(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const businessId = req.user!.businessId!;
    const { question, language = 'en' } = req.body;

    if (!question || typeof question !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Question is required and must be a valid text string.',
      });
      return;
    }

    const result = await processNaturalLanguageQuery(businessId, question, language);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function handleActionConfirm(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const businessId = req.user!.businessId!;
    const userId = req.user!.userId;
    const { action, productId, newPrice, newName, newCategory } = req.body;


    if (!action || !productId) {
      res.status(400).json({
        success: false,
        error: 'Action and productId are required.',
      });
      return;
    }

    const result = await confirmProductWriteAction(businessId, userId, {
      action,
      productId,
      newPrice: newPrice !== undefined ? Number(newPrice) : undefined,
      newName,
      newCategory,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getQuerySuggestions(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const language = (req.query.language as string) || 'en';

    const suggestions = [
      {
        text: 'What is my total revenue?',
        category: 'revenue',
        icon: 'trending-up',
        translation_hi: 'मेरी कुल कमाई कितनी है?',
        translation_pa: 'ਮੇਰੀ ਕੁੱਲ ਕਮਾਈ ਕਿੰਨੀ ਹੋਈ?',
      },
      {
        text: 'Which products are selling the most?',
        category: 'products',
        icon: 'package',
        translation_hi: 'सबसे ज्यादा बिकने वाला सामान क्या है?',
        translation_pa: 'ਸਭ ਤੋਂ ਵੱਧ ਵਿਕਣ ਵਾਲਾ ਉਤਪਾਦ ਕਿਹੜਾ ਹੈ?',
      },
      {
        text: 'Who are my top customers?',
        category: 'customers',
        icon: 'users',
        translation_hi: 'सबसे बड़े ग्राहक कौन हैं?',
        translation_pa: 'ਸਭ ਤੋਂ ਵੱਡੇ ਗਾਹਕ ਕੌਣ ਹਨ?',
      },
      {
        text: 'How many pending bills need review?',
        category: 'bills',
        icon: 'alert-circle',
        translation_hi: 'कितने बिल समीक्षा के लिए लंबित हैं?',
        translation_pa: 'ਕਿੰਨੇ ਬਿੱਲ ਬਕਾਇਆ ਹਨ?',
      },
      {
        text: 'Change Basmati rice price to 480',
        category: 'action',
        icon: 'tag',
        translation_hi: 'बासमती चावल का भाव 480 कर दो',
        translation_pa: 'ਬਾਸਮਤੀ ਚਾਵਲ ਦਾ ਰੇਟ 480 ਕਰੋ',
      },
      {
        text: 'What are my estimated expenses and profit margin?',
        category: 'profit',
        icon: 'pie-chart',
        translation_hi: 'मेरा अनुमानित मुनाफा और खर्च क्या है?',
        translation_pa: 'ਮੇਰਾ ਮੁਨਾਫਾ ਅਤੇ ਖਰਚਾ ਕਿੰਨਾ ਹੈ?',
      },
    ];

    res.json({
      success: true,
      data: suggestions,
      language,
    });
  } catch (error) {
    next(error);
  }
}
