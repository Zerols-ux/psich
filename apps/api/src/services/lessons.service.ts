import { Prisma, type Lesson, type LessonType, type PrismaClient } from '@prisma/client';
import { HttpError } from '../middleware/errorHandler.js';

export interface CreateLessonInput {
  title: string;
  type: LessonType;
  isFree?: boolean;
  orderIndex?: number;
  youtubeUrl?: string | null;
  contentMd?: string | null;
  pdfUrl?: string | null;
  meetLink?: string | null;
  webinarAt?: string | null;
}

export type UpdateLessonInput = Partial<CreateLessonInput>;

function lessonInputToDate(value: string | null | undefined): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new HttpError(400, 'Invalid webinarAt timestamp');
  }
  return d;
}

export async function createLesson(
  prisma: PrismaClient,
  courseId: string,
  input: CreateLessonInput,
): Promise<Lesson> {
  // Verify the parent course exists; otherwise Prisma surfaces a P2003 we'd
  // map to 400, which is true but less actionable than a clear 404.
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new HttpError(404, 'Course not found');

  let orderIndex = input.orderIndex;
  if (orderIndex === undefined) {
    const last = await prisma.lesson.findFirst({
      where: { courseId },
      orderBy: { orderIndex: 'desc' },
      select: { orderIndex: true },
    });
    orderIndex = (last?.orderIndex ?? -1) + 1;
  }

  const data: Prisma.LessonCreateInput = {
    title: input.title,
    type: input.type,
    isFree: input.isFree ?? false,
    orderIndex,
    youtubeUrl: input.youtubeUrl ?? null,
    contentMd: input.contentMd ?? null,
    pdfUrl: input.pdfUrl ?? null,
    meetLink: input.meetLink ?? null,
    webinarAt: lessonInputToDate(input.webinarAt) ?? null,
    course: { connect: { id: courseId } },
  };
  return prisma.lesson.create({ data });
}

export async function updateLesson(
  prisma: PrismaClient,
  id: string,
  input: UpdateLessonInput,
): Promise<Lesson> {
  const data: Prisma.LessonUpdateInput = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.type !== undefined) data.type = input.type;
  if (input.isFree !== undefined) data.isFree = input.isFree;
  if (input.orderIndex !== undefined) data.orderIndex = input.orderIndex;
  if (input.youtubeUrl !== undefined) data.youtubeUrl = input.youtubeUrl;
  if (input.contentMd !== undefined) data.contentMd = input.contentMd;
  if (input.pdfUrl !== undefined) data.pdfUrl = input.pdfUrl;
  if (input.meetLink !== undefined) data.meetLink = input.meetLink;
  if (input.webinarAt !== undefined) data.webinarAt = lessonInputToDate(input.webinarAt);

  try {
    return await prisma.lesson.update({ where: { id }, data });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw new HttpError(404, 'Lesson not found');
    }
    throw err;
  }
}

export async function deleteLesson(prisma: PrismaClient, id: string): Promise<void> {
  try {
    await prisma.lesson.delete({ where: { id } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw new HttpError(404, 'Lesson not found');
    }
    throw err;
  }
}
