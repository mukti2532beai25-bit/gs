import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../auth.js';

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing token' });
    return;
  }
  const token = header.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    return;
  }
  req.user = payload;
  next();
};

// Require user to belong to a specific business
export const requireBusiness = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user?.businessId) {
    res.status(403).json({ error: 'Forbidden: No business profile associated' });
    return;
  }
  next();
};
