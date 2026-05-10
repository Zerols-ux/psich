import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
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
  // Re-login so the access token carries role=ADMIN.
  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@example.com', password: 'AdminPass1234' })
    .expect(200);
  return login.body.accessToken;
}

async function makeStudentToken(): Promise<string> {
  const reg = await request(app)
    .post('/api/auth/register')
    .send({ email: 'student@example.com', name: 'Student', password: 'StudentPass12' })
    .expect(201);
  return reg.body.accessToken;
}

describe('GET /api/categories', () => {
  it('returns categories sorted by name without auth', async () => {
    await prisma.category.createMany({
      data: [
        { name: 'Самопізнання', slug: 'self' },
        { name: 'Стосунки', slug: 'relations' },
      ],
    });
    const res = await request(app).get('/api/categories').expect(200);
    expect(res.body.items).toHaveLength(2);
    expect(res.body.items[0].name).toBe('Самопізнання');
  });
});

describe('POST /api/categories', () => {
  it('rejects without auth', async () => {
    const res = await request(app).post('/api/categories').send({ name: 'X', slug: 'x' });
    expect(res.status).toBe(401);
  });

  it('rejects student users with 403', async () => {
    const token = await makeStudentToken();
    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'X', slug: 'x' });
    expect(res.status).toBe(403);
  });

  it('creates category for admin', async () => {
    const token = await makeAdminToken();
    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Тривога', slug: 'anxiety' });
    expect(res.status).toBe(201);
    expect(res.body.item.slug).toBe('anxiety');
  });

  it('returns 409 on duplicate slug', async () => {
    const token = await makeAdminToken();
    await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Anxiety', slug: 'anxiety' })
      .expect(201);
    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Anxiety 2', slug: 'anxiety' });
    expect(res.status).toBe(409);
  });

  it('returns 400 for invalid slug', async () => {
    const token = await makeAdminToken();
    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'X', slug: 'Has Spaces' });
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/categories/:id', () => {
  it('updates a category for admin', async () => {
    const token = await makeAdminToken();
    const created = await prisma.category.create({
      data: { name: 'Old', slug: 'old' },
    });
    const res = await request(app)
      .patch(`/api/categories/${created.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'New' });
    expect(res.status).toBe(200);
    expect(res.body.item.name).toBe('New');
  });

  it('returns 404 for missing category', async () => {
    const token = await makeAdminToken();
    const res = await request(app)
      .patch('/api/categories/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'X' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/categories/:id', () => {
  it('deletes a category for admin', async () => {
    const token = await makeAdminToken();
    const created = await prisma.category.create({
      data: { name: 'Tmp', slug: 'tmp' },
    });
    const res = await request(app)
      .delete(`/api/categories/${created.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);
    const found = await prisma.category.findUnique({ where: { id: created.id } });
    expect(found).toBeNull();
  });
});
