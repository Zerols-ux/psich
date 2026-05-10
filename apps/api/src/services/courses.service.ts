import { Prisma, type Course, type Lesson, type PrismaClient } from '@prisma/client';
import type {
  Category as CategoryType,
  CourseDetail,
  CourseSummary,
  LessonPreview,
} from '@psich/types';
import { HttpError } from '../middleware/errorHandler.js';

export interface ListCoursesQuery {
  categorySlug?: string | undefined;
  search?: string | undefined;
}

export interface CreateCourseInput {
  title: string;
  slug: string;
  description: string;
  price: number;
  thumbnailUrl?: string | null;
  categoryId?: string | null;
  isPublished?: boolean;
}

export type UpdateCourseInput = Partial<CreateCourseInput>;

type CourseRow = Course & {
  category: { id: string; name: string; slug: string } | null;
  _count: { lessons: number };
  lessons?: { isFree: boolean }[];
};

type CourseDetailRow = Course & {
  category: { id: string; name: string; slug: string } | null;
  lessons: Lesson[];
};

function decimalToNumber(d: Prisma.Decimal | number): number {
  if (typeof d === 'number') return d;
  return Number(d.toString());
}

function categoryDto(c: { id: string; name: string; slug: string } | null): CategoryType | null {
  if (!c) return null;
  return { id: c.id, name: c.name, slug: c.slug };
}

function summaryDto(row: CourseRow): CourseSummary {
  const hasFreeLessons = (row.lessons ?? []).some((l) => l.isFree);
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    thumbnailUrl: row.thumbnailUrl,
    price: decimalToNumber(row.price),
    isPublished: row.isPublished,
    categoryId: row.categoryId,
    category: categoryDto(row.category),
    lessonsCount: row._count.lessons,
    hasFreeLessons,
    createdAt: row.createdAt.toISOString(),
  };
}

function lessonPreviewDto(l: Lesson): LessonPreview {
  return {
    id: l.id,
    title: l.title,
    type: l.type,
    isFree: l.isFree,
    orderIndex: l.orderIndex,
    webinarAt: l.webinarAt ? l.webinarAt.toISOString() : null,
    contentMd: l.isFree ? l.contentMd : null,
    youtubeUrl: l.isFree ? l.youtubeUrl : null,
  };
}

function detailDto(row: CourseDetailRow): CourseDetail {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    thumbnailUrl: row.thumbnailUrl,
    price: decimalToNumber(row.price),
    isPublished: row.isPublished,
    categoryId: row.categoryId,
    category: categoryDto(row.category),
    createdAt: row.createdAt.toISOString(),
    lessons: row.lessons.map(lessonPreviewDto),
  };
}

export async function listPublicCourses(
  prisma: PrismaClient,
  query: ListCoursesQuery = {},
): Promise<CourseSummary[]> {
  const where: Prisma.CourseWhereInput = { isPublished: true };
  if (query.categorySlug) {
    where.category = { slug: query.categorySlug };
  }
  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } },
    ];
  }
  const rows = await prisma.course.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      category: true,
      _count: { select: { lessons: true } },
      lessons: { select: { isFree: true } },
    },
  });
  return rows.map(summaryDto);
}

export async function listAdminCourses(prisma: PrismaClient): Promise<CourseSummary[]> {
  const rows = await prisma.course.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      category: true,
      _count: { select: { lessons: true } },
      lessons: { select: { isFree: true } },
    },
  });
  return rows.map(summaryDto);
}

export async function getCourseBySlugPublic(
  prisma: PrismaClient,
  slug: string,
): Promise<CourseDetail> {
  const row = await prisma.course.findFirst({
    where: { slug, isPublished: true },
    include: {
      category: true,
      lessons: { orderBy: { orderIndex: 'asc' } },
    },
  });
  if (!row) throw new HttpError(404, 'Course not found');
  return detailDto(row);
}

export async function getCourseByIdAdmin(prisma: PrismaClient, id: string): Promise<CourseDetail> {
  const row = await prisma.course.findUnique({
    where: { id },
    include: {
      category: true,
      lessons: { orderBy: { orderIndex: 'asc' } },
    },
  });
  if (!row) throw new HttpError(404, 'Course not found');
  // Admin view: show contentMd / youtubeUrl for every lesson regardless of isFree.
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    thumbnailUrl: row.thumbnailUrl,
    price: decimalToNumber(row.price),
    isPublished: row.isPublished,
    categoryId: row.categoryId,
    category: categoryDto(row.category),
    createdAt: row.createdAt.toISOString(),
    lessons: row.lessons.map((l) => ({
      id: l.id,
      title: l.title,
      type: l.type,
      isFree: l.isFree,
      orderIndex: l.orderIndex,
      webinarAt: l.webinarAt ? l.webinarAt.toISOString() : null,
      contentMd: l.contentMd,
      youtubeUrl: l.youtubeUrl,
    })),
  };
}

export async function createCourse(
  prisma: PrismaClient,
  input: CreateCourseInput,
): Promise<CourseSummary> {
  try {
    const row = await prisma.course.create({
      data: {
        title: input.title,
        slug: input.slug,
        description: input.description,
        price: new Prisma.Decimal(input.price),
        thumbnailUrl: input.thumbnailUrl ?? null,
        categoryId: input.categoryId ?? null,
        isPublished: input.isPublished ?? false,
      },
      include: {
        category: true,
        _count: { select: { lessons: true } },
        lessons: { select: { isFree: true } },
      },
    });
    return summaryDto(row);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') throw new HttpError(409, 'Course with this slug already exists');
      if (err.code === 'P2003') throw new HttpError(400, 'Category does not exist');
    }
    throw err;
  }
}

export async function updateCourse(
  prisma: PrismaClient,
  id: string,
  input: UpdateCourseInput,
): Promise<CourseSummary> {
  const data: Prisma.CourseUpdateInput = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.slug !== undefined) data.slug = input.slug;
  if (input.description !== undefined) data.description = input.description;
  if (input.price !== undefined) data.price = new Prisma.Decimal(input.price);
  if (input.thumbnailUrl !== undefined) data.thumbnailUrl = input.thumbnailUrl;
  if (input.isPublished !== undefined) data.isPublished = input.isPublished;
  if (input.categoryId !== undefined) {
    data.category = input.categoryId ? { connect: { id: input.categoryId } } : { disconnect: true };
  }

  try {
    const row = await prisma.course.update({
      where: { id },
      data,
      include: {
        category: true,
        _count: { select: { lessons: true } },
        lessons: { select: { isFree: true } },
      },
    });
    return summaryDto(row);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') throw new HttpError(404, 'Course not found');
      if (err.code === 'P2002') throw new HttpError(409, 'Course with this slug already exists');
      if (err.code === 'P2003') throw new HttpError(400, 'Category does not exist');
    }
    throw err;
  }
}

export async function deleteCourse(prisma: PrismaClient, id: string): Promise<void> {
  try {
    await prisma.course.delete({ where: { id } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw new HttpError(404, 'Course not found');
    }
    throw err;
  }
}
