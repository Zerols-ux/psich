import crypto from 'node:crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import type { UserRole } from '@prisma/client';
import { env } from '../env.js';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  const opts: SignOptions = { expiresIn: env.ACCESS_TOKEN_TTL_SECONDS };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, opts);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
  if (typeof decoded === 'string') {
    throw new Error('Invalid access token payload');
  }
  return decoded as unknown as AccessTokenPayload;
}

/**
 * Refresh tokens are opaque random strings; we store only their SHA-256 hash in
 * the DB. The raw token lives only in the user's httpOnly cookie.
 */
export function generateRefreshToken(): { token: string; tokenHash: string } {
  const token = crypto.randomBytes(48).toString('base64url');
  const tokenHash = hashRefreshToken(token);
  return { token, tokenHash };
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
