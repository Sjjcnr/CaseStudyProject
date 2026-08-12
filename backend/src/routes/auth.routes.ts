import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { env } from '../config/env';
import { sendSuccess, sendError } from '../utils/response';
import { validateRequest } from '../middlewares/validate';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// POST /api/v1/auth/login
router.post(
  '/login',
  validateRequest({ body: loginSchema }),
  async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });

      if (!user) {
        return sendError(res, 'INVALID_CREDENTIALS', 'Invalid email or password', [], 401);
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return sendError(res, 'INVALID_CREDENTIALS', 'Invalid email or password', [], 401);
      }

      const payload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      };

      // Short-lived JWT token (8 hours)
      const accessToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '8h' });

      return sendSuccess(res, {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch (err: any) {
      console.error('Login database connection error:', err?.message || err);
      return sendError(
        res,
        'DATABASE_ERROR',
        'Unable to connect to PostgreSQL database. Please ensure a valid DATABASE_URL is configured in backend/.env',
        [],
        500
      );
    }
  }
);

// POST /api/v1/auth/logout
router.post('/logout', authenticateJWT, (req: Request, res: Response) => {
  return sendSuccess(res, { message: 'Logged out successfully' });
});

// GET /api/v1/auth/me
router.get('/me', authenticateJWT, async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 'UNAUTHORIZED', 'Not authenticated', [], 401);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    if (!user) {
      return sendError(res, 'NOT_FOUND', 'User not found', [], 404);
    }

    return sendSuccess(res, { user });
  } catch (err: any) {
    return sendError(res, 'DATABASE_ERROR', 'Database error fetching profile', [], 500);
  }
});

export default router;
