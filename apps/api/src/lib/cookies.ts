import type { CookieOptions, Response } from 'express';
import { env } from '../env.js';

export const REFRESH_COOKIE_NAME = 'psy_refresh';

function baseCookieOptions(): CookieOptions {
  const isProd = env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE || isProd,
    sameSite: env.COOKIE_SECURE || isProd ? 'none' : 'lax',
    domain: env.COOKIE_DOMAIN,
    path: '/',
  };
}

export function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    ...baseCookieOptions(),
    maxAge: env.REFRESH_TOKEN_TTL_SECONDS * 1000,
  });
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, baseCookieOptions());
}
