import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { REFRESH_COOKIE_NAME, clearRefreshCookie, setRefreshCookie } from '../lib/cookies.js';
import {
  type AuthContext,
  login,
  logout,
  publicUser,
  register,
  rotateRefreshToken,
} from '../services/auth.service.js';

const router = Router();

const registerSchema = z.object({
  email: z.string().email().max(254),
  name: z.string().min(2).max(120),
  password: z.string().min(8).max(72),
});

const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(72),
});

function ctxFromReq(req: Request): AuthContext {
  return {
    prisma,
    userAgent: req.header('user-agent') ?? undefined,
    ip: req.ip ?? undefined,
  };
}

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'Invalid registration payload', parsed.error.flatten());
    }
    const session = await register(ctxFromReq(req), parsed.data);
    setRefreshCookie(res, session.refreshToken);
    res.status(201).json({ user: publicUser(session.user), accessToken: session.accessToken });
  }),
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'Invalid login payload', parsed.error.flatten());
    }
    const session = await login(ctxFromReq(req), parsed.data);
    setRefreshCookie(res, session.refreshToken);
    res.json({ user: publicUser(session.user), accessToken: session.accessToken });
  }),
);

router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const raw = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    if (!raw) {
      throw new HttpError(401, 'Missing refresh token');
    }
    try {
      const session = await rotateRefreshToken(ctxFromReq(req), raw);
      setRefreshCookie(res, session.refreshToken);
      res.json({ user: publicUser(session.user), accessToken: session.accessToken });
    } catch (err) {
      clearRefreshCookie(res);
      throw err;
    }
  }),
);

router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const raw = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    await logout(ctxFromReq(req), raw);
    clearRefreshCookie(res);
    res.status(204).end();
  }),
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new HttpError(401, 'Not authenticated');
    const user = await prisma.user.findUnique({ where: { id: req.user.sub } });
    if (!user) throw new HttpError(401, 'User no longer exists');
    res.json({ user: publicUser(user) });
  }),
);

export default router;
