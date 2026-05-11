import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { env } from '../env.js';
import { logger } from '../lib/logger.js';
import { HttpError } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { REFRESH_COOKIE_NAME, clearRefreshCookie, setRefreshCookie } from '../lib/cookies.js';
import {
  configureGoogleStrategy,
  googleAuthEnabled,
  passport,
  type GoogleOAuthProfile,
} from '../lib/passport.js';
import {
  type AuthContext,
  login,
  loginOrRegisterWithGoogle,
  logout,
  publicUser,
  register,
  rotateRefreshToken,
} from '../services/auth.service.js';

configureGoogleStrategy();

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

/**
 * Builds the URL we redirect the browser back to after the OAuth dance.
 * `status` is one of `ok` / `error` so the web `/auth/google/callback` page
 * can show a friendly message instead of a generic spinner forever.
 */
function buildWebRedirect(status: 'ok' | 'error', message?: string): string {
  const url = new URL('/auth/google/callback', env.WEB_APP_URL);
  url.searchParams.set('status', status);
  if (message) url.searchParams.set('message', message);
  return url.toString();
}

function ensureGoogleEnabled(_req: Request, _res: Response, next: NextFunction): void {
  if (!googleAuthEnabled) {
    next(
      new HttpError(
        503,
        'Google sign-in is not configured on this server (missing GOOGLE_CLIENT_ID/SECRET)',
      ),
    );
    return;
  }
  next();
}

router.get(
  '/google',
  ensureGoogleEnabled,
  passport.authenticate('google', { scope: ['profile', 'email'], session: false }),
);

router.get(
  '/google/callback',
  ensureGoogleEnabled,
  (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate(
      'google',
      { session: false },
      (err: Error | null, profile: GoogleOAuthProfile | false) => {
        if (err) {
          // Network / strategy-level failure. Surface a generic message to the user.
          return res.redirect(buildWebRedirect('error', 'google_auth_failed'));
        }
        if (!profile) {
          // User denied consent on the Google screen.
          return res.redirect(buildWebRedirect('error', 'access_denied'));
        }
        (async () => {
          try {
            const session = await loginOrRegisterWithGoogle(ctxFromReq(req), profile);
            setRefreshCookie(res, session.refreshToken);
            res.redirect(buildWebRedirect('ok'));
          } catch (e) {
            // The browser is mid-redirect from Google — the JSON error handler
            // would render raw text in the address bar. Keep the UX consistent
            // with the other two error branches and send the user back to the
            // web app's callback page with a generic error code. Log so we can
            // still chase down the underlying failure.
            logger.error({ err: e }, 'google oauth callback: account create/link failed');
            res.redirect(buildWebRedirect('error', 'internal_error'));
          }
        })();
      },
    )(req, res, next);
  },
);

export default router;
