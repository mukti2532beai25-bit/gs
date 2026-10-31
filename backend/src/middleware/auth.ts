import { Request, Response, NextFunction } from 'express';
import { verifyToken, AuthTokenPayload } from '../utils/auth.js';

export interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Authentication required. Missing or malformed Bearer token.',
    });
    return;
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired authentication token.',
    });
    return;
  }

  req.user = payload;
  next();
}

export function requireBusiness(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user?.businessId) {
    res.status(403).json({
      success: false,
      error: 'Access denied. Account is not linked to any active business entity.',
    });
    return;
  }
  next();
}
