import { listCategories, listCourses } from '@/lib/courses';
import { CoursesView } from './CoursesView';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CoursesPage() {
  const [courses, categories] = await Promise.all([
    listCourses().catch(() => []),
    listCategories().catch(() => []),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-20 md:px-10">
      <h1 className="text-4xl md:text-5xl">
        Всі <span className="text-gold">курси</span>
      </h1>
      <p className="mt-3 text-text-muted">Оберіть свій шлях до змін</p>

      <CoursesView initialCourses={courses} categories={categories} />
    </div>
  );
}
