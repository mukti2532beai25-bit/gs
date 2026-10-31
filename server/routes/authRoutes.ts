import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { hashPassword, verifyPassword, signToken } from '../auth.js';
import { requireAuth, AuthRequest } from '../middleware/requireAuth.js';

const router = Router();

// ── Schema validators ────────────────────────────────────────────────────────
const SignupSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(128),
  businessName: z.string().min(2).max(120).optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ── POST /api/auth/signup ────────────────────────────────────────────────────
router.post('/signup', async (req: Request, res: Response) => {
  const parse = SignupSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'Validation failed', details: parse.error.flatten() });
  }

  const { name, email, password, businessName } = parse.data;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    // Create business if provided
    let business = null;
    if (businessName) {
      business = await prisma.business.create({
        data: { name: businessName },
      });
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashPassword(password),
        role: 'owner',
        businessId: business?.id ?? null,
      },
    });

    const token = signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      businessId: user.businessId,
      role: user.role,
    });

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        businessId: user.businessId,
        business: business ? { id: business.id, name: business.name } : null,
      },
    });
  } catch (err) {
    console.error('[auth/signup]', err);
    return res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// ── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req: Request, res: Response) => {
  const parse = LoginSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const { email, password } = parse.data;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { business: true },
    });

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      businessId: user.businessId,
      role: user.role,
    });

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        businessId: user.businessId,
        business: user.business ? { id: user.business.id, name: user.business.name, language: user.business.language } : null,
      },
    });
  } catch (err) {
    console.error('[auth/login]', err);
    return res.status(500).json({ error: 'Authentication failed. Please try again.' });
  }
});

// ── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: { business: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      businessId: user.businessId,
      business: user.business,
    });
  } catch (err) {
    console.error('[auth/me]', err);
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;
