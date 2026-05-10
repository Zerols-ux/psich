import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../middleware/errorHandler.js';
import { asyncHandler, requireParam } from '../middleware/asyncHandler.js';
import { requireAdmin, requireAuth } from '../middleware/requireAuth.js';
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from '../services/categories.service.js';

const router = Router();

const slugRegex = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

const createSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(120).regex(slugRegex, 'slug must be kebab-case'),
});

const updateSchema = createSchema.partial();

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const items = await listCategories(prisma);
    res.json({ items });
  }),
);

router.post(
  '/',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'Invalid category payload', parsed.error.flatten());
    }
    const item = await createCategory(prisma, parsed.data);
    res.status(201).json({ item });
  }),
);

router.patch(
  '/:id',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'Invalid category payload', parsed.error.flatten());
    }
    const item = await updateCategory(prisma, requireParam(req, 'id'), parsed.data);
    res.json({ item });
  }),
);

router.delete(
  '/:id',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    await deleteCategory(prisma, requireParam(req, 'id'));
    res.status(204).end();
  }),
);

export default router;
