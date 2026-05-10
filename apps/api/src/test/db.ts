import { prisma } from '../lib/prisma.js';

const TABLES = [
  'refresh_tokens',
  'comments',
  'lesson_progress',
  'certificates',
  'orders',
  'enrollments',
  'lessons',
  'courses',
  'categories',
  'promo_codes',
  'blog_posts',
  'users',
];

export async function resetDb(): Promise<void> {
  const list = TABLES.map((t) => `"${t}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
}
