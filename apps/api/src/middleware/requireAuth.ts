import type { NextFunction, Request, Response } from 'express';
import { HttpError } from './errorHandler.js';
import { verifyAccessToken, type AccessTokenPayload } from '../lib/tokens.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.header('authorization') ?? req.header('Authorization');
  if (!header || !header.toLowerCase().startsWith('bearer ')) {
    next(new HttpError(401, 'Missing or invalid Authorization header'));
    return;
  }
  const token = header.slice(7).trim();
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    next(new HttpError(401, 'Invalid or expired access token'));
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    next(new HttpError(401, 'Not authenticated'));
    return;
  }
  if (req.user.role !== 'ADMIN') {
    next(new HttpError(403, 'Admin role required'));
    return;
  }
  next();
}
