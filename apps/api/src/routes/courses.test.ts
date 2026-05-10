import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { Prisma } from '@prisma/client';
import { createServer } from '../server.js';
import { prisma } from '../lib/prisma.js';
import { resetDb } from '../test/db.js';

let app: Express;

beforeAll(() => {
  app = createServer();
});

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await prisma.$disconnect();
});

async function makeAdminToken(): Promise<string> {
  const reg = await request(app)
    .post('/api/auth/register')
    .send({ email: 'admin@example.com', name: 'Admin', password: 'AdminPass1234' })
    .expect(201);
  await prisma.user.update({ where: { id: reg.body.user.id }, data: { role: 'ADMIN' } });
  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@example.com', password: 'AdminPass1234' })
    .expect(200);
  return login.body.accessToken;
}

async function makeStudentToken(): Promise<string> {
  const reg = await request(app)
    .post('/api/auth/register')
    .send({ email: 'stud@example.com', name: 'Stud', password: 'StudentPass12' })
    .expect(201);
  return reg.body.accessToken;
}

async function seedCourse(
  opts: {
    title?: string;
    slug?: string;
    isPublished?: boolean;
    categorySlug?: string;
    lessons?: Array<{ title: string; isFree: boolean }>;
  } = {},
) {
  let categoryId: string | undefined;
  if (opts.categorySlug) {
    const cat = await prisma.category.create({
      data: { name: opts.categorySlug, slug: opts.categorySlug },
    });
    categoryId = cat.id;
  }
  const course = await prisma.course.create({
    data: {
      title: opts.title ?? 'Test course',
      slug: opts.slug ?? 'test-course',
      description: 'desc',
      price: new Prisma.Decimal(1000),
      isPublished: opts.isPublished ?? true,
      categoryId,
    },
  });
  if (opts.lessons) {
    for (const [i, l] of opts.lessons.entries()) {
      await prisma.lesson.create({
        data: {
          courseId: course.id,
          title: l.title,
          type: 'VIDEO',
          isFree: l.isFree,
          orderIndex: i,
          contentMd: 'lesson body markdown',
          youtubeUrl: 'https://youtube.com/watch?v=xyz',
        },
      });
    }
  }
  return course;
}

describe('GET /api/courses', () => {
  it('returns only published courses', async () => {
    await seedCourse({ slug: 'pub', isPublished: true });
    await seedCourse({ slug: 'draft', isPublished: false });
    const res = await request(app).get('/api/courses').expect(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].slug).toBe('pub');
  });

  it('filters by category slug', async () => {
    await seedCourse({ slug: 'self-course', categorySlug: 'self' });
    await seedCourse({ slug: 'rel-course', categorySlug: 'relations' });
    const res = await request(app).get('/api/courses?category=self').expect(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].slug).toBe('self-course');
  });

  it('filters by search term across title and description', async () => {
    await prisma.course.create({
      data: {
        title: 'Тривога',
        slug: 'anxiety',
        description: 'безсоння і паніка',
        price: new Prisma.Decimal(0),
        isPublished: true,
      },
    });
    await prisma.course.create({
      data: {
        title: 'Травма',
        slug: 'trauma',
        description: 'дитячі переживання',
        price: new Prisma.Decimal(0),
        isPublished: true,
      },
    });
    const res = await request(app).get('/api/courses?search=паніка').expect(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].slug).toBe('anxiety');
  });

  it('marks hasFreeLessons based on lessons', async () => {
    await seedCourse({
      slug: 'mixed',
      lessons: [
        { title: 'Intro', isFree: true },
        { title: 'Paid', isFree: false },
      ],
    });
    const res = await request(app).get('/api/courses').expect(200);
    expect(res.body.items[0].hasFreeLessons).toBe(true);
    expect(res.body.items[0].lessonsCount).toBe(2);
  });
});

describe('GET /api/courses/:slug', () => {
  it('returns course detail with lessons in order', async () => {
    await seedCourse({
      slug: 'pub',
      lessons: [
        { title: 'L1', isFree: true },
        { title: 'L2', isFree: false },
      ],
    });
    const res = await request(app).get('/api/courses/pub').expect(200);
    expect(res.body.item.slug).toBe('pub');
    expect(res.body.item.lessons).toHaveLength(2);
    expect(res.body.item.lessons[0].orderIndex).toBe(0);
  });

  it('hides contentMd and youtubeUrl on paid lessons but keeps them on free ones', async () => {
    await seedCourse({
      slug: 'mixed',
      lessons: [
        { title: 'Free intro', isFree: true },
        { title: 'Paid module', isFree: false },
      ],
    });
    const res = await request(app).get('/api/courses/mixed').expect(200);
    const free = res.body.item.lessons.find((l: { title: string }) => l.title === 'Free intro');
    const paid = res.body.item.lessons.find((l: { title: string }) => l.title === 'Paid module');
    expect(free.contentMd).toBe('lesson body markdown');
    expect(free.youtubeUrl).toBeTruthy();
    expect(paid.contentMd).toBeNull();
    expect(paid.youtubeUrl).toBeNull();
  });

  it('returns 404 for unpublished courses to anonymous users', async () => {
    await seedCourse({ slug: 'hidden', isPublished: false });
    const res = await request(app).get('/api/courses/hidden');
    expect(res.status).toBe(404);
  });

  it('returns 404 for unknown slug', async () => {
    const res = await request(app).get('/api/courses/does-not-exist');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/courses', () => {
  it('rejects without auth', async () => {
    const res = await request(app)
      .post('/api/courses')
      .send({ title: 'X', slug: 'x', description: 'd', price: 0 });
    expect(res.status).toBe(401);
  });

  it('rejects students with 403', async () => {
    const token = await makeStudentToken();
    const res = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'X', slug: 'x', description: 'd', price: 0 });
    expect(res.status).toBe(403);
  });

  it('admins can create a course (defaults to draft)', async () => {
    const token = await makeAdminToken();
    const res = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Mind',
        slug: 'mind',
        description: 'About the mind',
        price: 1500,
      });
    expect(res.status).toBe(201);
    expect(res.body.item.isPublished).toBe(false);
    expect(res.body.item.price).toBe(1500);
  });

  it('returns 400 if categoryId points to a missing category', async () => {
    const token = await makeAdminToken();
    const res = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Mind',
        slug: 'mind',
        description: 'd',
        price: 0,
        categoryId: '00000000-0000-0000-0000-000000000000',
      });
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/courses/:id', () => {
  it('admins can publish a draft', async () => {
    const token = await makeAdminToken();
    const course = await seedCourse({ slug: 'draft', isPublished: false });
    const res = await request(app)
      .patch(`/api/courses/${course.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ isPublished: true });
    expect(res.status).toBe(200);
    expect(res.body.item.isPublished).toBe(true);
  });
});

describe('DELETE /api/courses/:id', () => {
  it('admin delete cascades lessons', async () => {
    const token = await makeAdminToken();
    const course = await seedCourse({
      slug: 'todelete',
      lessons: [{ title: 'L', isFree: false }],
    });
    const res = await request(app)
      .delete(`/api/courses/${course.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);
    const lessons = await prisma.lesson.findMany({ where: { courseId: course.id } });
    expect(lessons).toHaveLength(0);
  });
});

describe('Lessons sub-resource', () => {
  it('admins can append a lesson and orderIndex auto-increments', async () => {
    const token = await makeAdminToken();
    const course = await seedCourse({
      slug: 'with-lessons',
      lessons: [{ title: 'L1', isFree: true }],
    });
    const res = await request(app)
      .post(`/api/courses/${course.id}/lessons`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'L2', type: 'VIDEO' });
    expect(res.status).toBe(201);
    expect(res.body.item.orderIndex).toBe(1);
  });

  it('returns 404 when adding a lesson to a missing course', async () => {
    const token = await makeAdminToken();
    const res = await request(app)
      .post('/api/courses/00000000-0000-0000-0000-000000000000/lessons')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'X', type: 'TEXT' });
    expect(res.status).toBe(404);
  });

  it('admin can update a lesson', async () => {
    const token = await makeAdminToken();
    const course = await seedCourse({
      slug: 'upd',
      lessons: [{ title: 'L1', isFree: false }],
    });
    const lesson = await prisma.lesson.findFirstOrThrow({ where: { courseId: course.id } });
    const res = await request(app)
      .patch(`/api/courses/lessons/${lesson.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ isFree: true });
    expect(res.status).toBe(200);
    expect(res.body.item.isFree).toBe(true);
  });

  it('admin can delete a lesson', async () => {
    const token = await makeAdminToken();
    const course = await seedCourse({
      slug: 'del',
      lessons: [{ title: 'L1', isFree: false }],
    });
    const lesson = await prisma.lesson.findFirstOrThrow({ where: { courseId: course.id } });
    const res = await request(app)
      .delete(`/api/courses/lessons/${lesson.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);
  });
});
