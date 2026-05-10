// Importing env.ts has the side-effect of loading .env (via dotenv/config)
// and mirroring the validated DATABASE_URL default into process.env, so this
// script works on a fresh clone with no apps/api/.env file.
import '../src/env.js';
import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  // Categories — upsert by slug so re-running the seed is idempotent.
  const categories = [
    { name: 'Самопізнання', slug: 'self' },
    { name: 'Стосунки', slug: 'relations' },
    { name: 'Тривога та стрес', slug: 'anxiety' },
    { name: 'Травма', slug: 'trauma' },
  ];
  for (const c of categories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name },
      create: c,
    });
  }
  const cats = await prisma.category.findMany();
  const bySlug = Object.fromEntries(cats.map((c) => [c.slug, c.id]));

  const courses = [
    {
      title: 'Архітектура особистості',
      slug: 'architectura-osobystosti',
      description:
        'Глибоке занурення у власну психіку. 8 модулів практичної роботи зі схемами поведінки, цінностями та внутрішніми частинами.',
      price: new Prisma.Decimal(2800),
      categorySlug: 'self',
      isPublished: true,
      lessons: [
        { title: 'Знайомство з курсом', type: 'VIDEO' as const, isFree: true },
        { title: 'Карта внутрішніх частин', type: 'VIDEO' as const, isFree: false },
        { title: 'Робота з критиком', type: 'TEXT' as const, isFree: false },
      ],
    },
    {
      title: 'Здорові межі',
      slug: 'zdorovi-mezhi',
      description:
        'Як будувати стосунки без втрати себе. Практичні техніки для відновлення особистого простору.',
      price: new Prisma.Decimal(1900),
      categorySlug: 'relations',
      isPublished: true,
      lessons: [
        { title: 'Що таке межі', type: 'VIDEO' as const, isFree: true },
        { title: 'Як казати «ні»', type: 'VIDEO' as const, isFree: false },
        { title: 'Сценарії розмов', type: 'PDF' as const, isFree: false },
      ],
    },
    {
      title: 'Спокій зсередини',
      slug: 'spokiy-zseredyny',
      description:
        'Інструменти для роботи з тривогою та панічними атаками — дихальні практики, заземлення, переоцінка думок.',
      price: new Prisma.Decimal(2200),
      categorySlug: 'anxiety',
      isPublished: true,
      lessons: [
        { title: 'Анатомія тривоги', type: 'VIDEO' as const, isFree: true },
        { title: 'Швидкі техніки заземлення', type: 'VIDEO' as const, isFree: true },
        { title: 'Когнітивна реструктуризація', type: 'TEXT' as const, isFree: false },
      ],
    },
    {
      title: 'Корінь травми',
      slug: 'korin-travmy',
      description:
        'Робота з дитячими травмами через тілесні та когнітивні практики. Курс для людей з досвідом терапії.',
      price: new Prisma.Decimal(3200),
      categorySlug: 'trauma',
      isPublished: true,
      lessons: [
        { title: 'Як формується травма', type: 'VIDEO' as const, isFree: false },
        { title: 'Тілесна пам’ять', type: 'VIDEO' as const, isFree: false },
      ],
    },
  ];

  for (const c of courses) {
    const data = {
      title: c.title,
      slug: c.slug,
      description: c.description,
      price: c.price,
      isPublished: c.isPublished,
      categoryId: bySlug[c.categorySlug] ?? null,
    };
    const course = await prisma.course.upsert({
      where: { slug: c.slug },
      update: data,
      create: data,
    });
    // Replace lessons so the seed is idempotent.
    await prisma.lesson.deleteMany({ where: { courseId: course.id } });
    for (const [i, l] of c.lessons.entries()) {
      await prisma.lesson.create({
        data: {
          courseId: course.id,
          title: l.title,
          type: l.type,
          isFree: l.isFree,
          orderIndex: i,
          contentMd:
            l.type === 'TEXT' || l.type === 'PDF'
              ? '## Урок\n\nКонтент уроку зʼявиться згодом.'
              : null,
        },
      });
    }
  }

  // eslint-disable-next-line no-console
  console.log(`Seed complete: ${cats.length} categories, ${courses.length} courses.`);
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
