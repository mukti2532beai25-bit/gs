import { Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { voiceCommandSchema } from '../validators/vocabValidators.js';
import { parseVoiceInput } from '../services/ai/voiceParsingService.js';

export async function processVoiceCommand(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = voiceCommandSchema.parse(req.body);
    const parsedAction = parseVoiceInput(input.transcript, input.language);

    // If billId is attached, record audit correction
    if (input.billId) {
      await prisma.correction.create({
        data: {
          billId: input.billId,
          userId: req.user!.userId,
          fieldName: parsedAction.fieldName || parsedAction.action,
          correctedValue: parsedAction.fieldValue || parsedAction.productName || input.transcript,
          source: 'voice',
        },
      });
    }

    res.json({
      success: true,
      data: parsedAction,
    });
  } catch (error) {
    next(error);
  }
}
