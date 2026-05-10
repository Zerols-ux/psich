import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { HttpError } from './errorHandler.js';

type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/**
 * Wraps an async Express handler so any thrown/rejected error reaches
 * the central error middleware (Express 4 doesn't auto-forward those).
 */
export function asyncHandler(fn: AsyncRequestHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Returns a route param that must be present. With `noUncheckedIndexedAccess`,
 * `req.params.x` is `string | undefined` even though Express only matches the
 * route when the param exists; this collapses that to a guaranteed string.
 */
export function requireParam(req: Request, name: string): string {
  const value = req.params[name];
  if (typeof value !== 'string' || value.length === 0) {
    throw new HttpError(400, `Missing :${name} parameter`);
  }
  return value;
}
