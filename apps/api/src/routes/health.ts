import { Router } from 'express';
import type { HealthcheckResponse } from '@psich/types';

const startedAt = Date.now();

export const healthRouter: Router = Router();

healthRouter.get('/health', (_req, res) => {
  const body: HealthcheckResponse = {
    status: 'ok',
    uptime: Math.round((Date.now() - startedAt) / 1000),
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? '0.0.0',
  };
  res.json(body);
});
