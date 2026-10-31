import { Router } from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

export const authRouter = Router();

authRouter.post('/signup', register);
authRouter.post('/login', login);
authRouter.get('/me', authenticate, getMe);
