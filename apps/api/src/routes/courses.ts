import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../middleware/errorHandler.js';
import { asyncHandler, requireParam } from '../middleware/asyncHandler.js';
import { requireAdmin, requireAuth } from '../middleware/requireAuth.js';
import {
  createCourse,
  deleteCourse,
  getCourseByIdAdmin,
  getCourseBySlugPublic,
  listAdminCourses,
  listPublicCourses,
  updateCourse,
} from '../services/courses.service.js';
import { createLesson, deleteLesson, updateLesson } from '../services/lessons.service.js';

const router = Router();

const slugRegex = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

const courseCreateSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(slugRegex, 'slug must be kebab-case'),
  description: z.string().min(1).max(8000),
  price: z.number().nonnegative().max(1_000_000),
  thumbnailUrl: z.string().url().nullable().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  isPublished: z.boolean().optional(),
});

const courseUpdateSchema = courseCreateSchema.partial();

const lessonTypeEnum = z.enum(['VIDEO', 'TEXT', 'PDF', 'WEBINAR']);

const lessonCreateSchema = z.object({
  title: z.string().min(1).max(200),
  type: lessonTypeEnum,
  isFree: z.boolean().optional(),
  orderIndex: z.number().int().min(0).optional(),
  youtubeUrl: z.string().url().nullable().optional(),
  contentMd: z.string().max(50_000).nullable().optional(),
  pdfUrl: z.string().url().nullable().optional(),
  meetLink: z.string().url().nullable().optional(),
  webinarAt: z.string().datetime().nullable().optional(),
});

const lessonUpdateSchema = lessonCreateSchema.partial();

const listQuerySchema = z.object({
  category: z.string().min(1).max(120).optional(),
  search: z.string().min(1).max(200).optional(),
});

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new HttpError(400, 'Invalid query parameters', parsed.error.flatten());
    }
    const items = await listPublicCourses(prisma, {
      categorySlug: parsed.data.category,
      search: parsed.data.search,
    });
    res.json({ items });
  }),
);

router.get(
  '/admin',
  requireAuth,
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const items = await listAdminCourses(prisma);
    res.json({ items });
  }),
);

router.get(
  '/admin/:id',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const item = await getCourseByIdAdmin(prisma, requireParam(req, 'id'));
    res.json({ item });
  }),
);

// Public lookup goes last so it doesn't shadow `/admin` and `/admin/:id`.
router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const item = await getCourseBySlugPublic(prisma, requireParam(req, 'slug'));
    res.json({ item });
  }),
);

router.post(
  '/',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const parsed = courseCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'Invalid course payload', parsed.error.flatten());
    }
    const item = await createCourse(prisma, parsed.data);
    res.status(201).json({ item });
  }),
);

router.patch(
  '/:id',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const parsed = courseUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'Invalid course payload', parsed.error.flatten());
    }
    const item = await updateCourse(prisma, requireParam(req, 'id'), parsed.data);
    res.json({ item });
  }),
);

router.delete(
  '/:id',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    await deleteCourse(prisma, requireParam(req, 'id'));
    res.status(204).end();
  }),
);

router.post(
  '/:courseId/lessons',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const parsed = lessonCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'Invalid lesson payload', parsed.error.flatten());
    }
    const item = await createLesson(prisma, requireParam(req, 'courseId'), parsed.data);
    res.status(201).json({ item });
  }),
);

router.patch(
  '/lessons/:id',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const parsed = lessonUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'Invalid lesson payload', parsed.error.flatten());
    }
    const item = await updateLesson(prisma, requireParam(req, 'id'), parsed.data);
    res.json({ item });
  }),
);

router.delete(
  '/lessons/:id',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    await deleteLesson(prisma, requireParam(req, 'id'));
    res.status(204).end();
  }),
);

export default router;
