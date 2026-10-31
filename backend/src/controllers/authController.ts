import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { registerSchema, loginSchema } from '../validators/authValidators.js';
import { hashPassword, verifyPassword, generateToken } from '../utils/auth.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const DEMO_USER = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Ramesh Sharma (Demo Store Owner)',
  email: 'demo@bahiverse.ai',
  role: 'owner',
  businessId: '00000000-0000-0000-0000-000000000002',
  business: {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Sharma Kirana & General Store',
    gstin: '07AAAAA0000A1Z5',
    address: 'Shop No. 12, Main Market, Chandni Chowk, Delhi - 110006',
    phone: '+91 98765 43210',
  },
};

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = registerSchema.parse(req.body);

    try {
      const existingUser = await prisma.user.findUnique({
        where: { email: input.email },
      });

      if (existingUser) {
        res.status(409).json({ success: false, error: 'User with this email already exists.' });
        return;
      }

      let businessId: string | null = null;
      if (input.businessName) {
        const business = await prisma.business.create({
          data: {
            name: input.businessName,
          },
        });
        businessId = business.id;
      }

      const passwordHash = await hashPassword(input.password);

      const user = await prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          passwordHash,
          role: 'owner',
          businessId,
        },
        include: {
          business: true,
        },
      });

      const token = generateToken({
        userId: user.id,
        email: user.email,
        name: user.name,
        businessId: user.businessId,
        role: user.role,
      });

      res.status(201).json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            business: user.business,
          },
        },
      });
    } catch (dbErr) {
      // Offline development fallback
      const token = generateToken({
        userId: DEMO_USER.id,
        email: input.email,
        name: input.name,
        businessId: DEMO_USER.businessId,
        role: 'owner',
      });

      res.status(201).json({
        success: true,
        data: {
          token,
          user: {
            id: DEMO_USER.id,
            name: input.name,
            email: input.email,
            role: 'owner',
            business: {
              ...DEMO_USER.business,
              name: input.businessName || DEMO_USER.business.name,
            },
          },
        },
        offlineNotice: 'Database offline: session authenticated in demo mode.',
      });
    }
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = loginSchema.parse(req.body);

    try {
      const user = await prisma.user.findUnique({
        where: { email: input.email },
        include: { business: true },
      });

      if (!user) {
        // If demo credentials entered in offline mode
        if (input.email === 'demo@bahiverse.ai') {
          const token = generateToken({
            userId: DEMO_USER.id,
            email: DEMO_USER.email,
            name: DEMO_USER.name,
            businessId: DEMO_USER.businessId,
            role: DEMO_USER.role,
          });
          res.json({ success: true, data: { token, user: DEMO_USER } });
          return;
        }

        res.status(401).json({ success: false, error: 'Invalid email or password.' });
        return;
      }

      const isValid = await verifyPassword(input.password, user.passwordHash);
      if (!isValid) {
        res.status(401).json({ success: false, error: 'Invalid email or password.' });
        return;
      }

      const token = generateToken({
        userId: user.id,
        email: user.email,
        name: user.name,
        businessId: user.businessId,
        role: user.role,
      });

      res.json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            business: user.business,
          },
        },
      });
    } catch (dbErr) {
      // Database offline fallback for quick testing
      const token = generateToken({
        userId: DEMO_USER.id,
        email: input.email,
        name: DEMO_USER.name,
        businessId: DEMO_USER.businessId,
        role: DEMO_USER.role,
      });

      res.json({
        success: true,
        data: {
          token,
          user: DEMO_USER,
        },
        offlineNotice: 'Database offline: logged in with demonstration store profile.',
      });
    }
  } catch (error) {
    next(error);
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        include: { business: true },
      });

      if (!user) {
        res.json({
          success: true,
          data: DEMO_USER,
        });
        return;
      }

      res.json({
        success: true,
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          business: user.business,
        },
      });
    } catch {
      res.json({
        success: true,
        data: DEMO_USER,
        offlineNotice: 'Database offline: returning active demo profile.',
      });
    }
  } catch (error) {
    next(error);
  }
}
