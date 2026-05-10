import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import type { LessonPreview } from '@psich/types';
import { formatUah, getCourseBySlug } from '@/lib/courses';

interface Props {
  params: { slug: string };
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = await getCourseBySlug(params.slug).catch(() => null);
  if (!course) return { title: 'Курс не знайдено' };
  return {
    title: `${course.title} — PSYPLATFORM`,
    description: course.description.slice(0, 160),
  };
}

const LESSON_TYPE_LABEL: Record<LessonPreview['type'], string> = {
  VIDEO: 'Відео',
  TEXT: 'Текст',
  PDF: 'PDF',
  WEBINAR: 'Вебінар',
};

function formatWebinarDate(value: string | null): string | null {
  if (!value) return null;
  return new Intl.DateTimeFormat('uk-UA', {
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export default async function CourseDetailPage({ params }: Props) {
  const course = await getCourseBySlug(params.slug);
  if (!course) notFound();

  const freeLessons = course.lessons.filter((l) => l.isFree).length;
  const totalLessons = course.lessons.length;

  return (
    <div className="mx-auto max-w-5xl px-6 py-20 md:px-10">
      <Link
        href="/courses"
        className="text-xs uppercase tracking-[0.2em] text-text-muted hover:text-gold"
      >
        ← До каталогу
      </Link>

      <header className="mt-6 grid gap-10 md:grid-cols-[1.4fr_1fr]">
        <div>
          {course.category && (
            <p className="text-xs uppercase tracking-[0.32em] text-violet">
              {course.category.name}
            </p>
          )}
          <h1 className="mt-3 text-4xl md:text-5xl">{course.title}</h1>
          <p className="mt-6 text-text-muted">{course.description}</p>

          <div className="mt-8 flex flex-wrap items-baseline gap-x-6 gap-y-2 text-sm text-text-muted">
            <span>{totalLessons} уроків</span>
            {freeLessons > 0 && <span className="text-gold">{freeLessons} безкоштовно</span>}
          </div>
        </div>

        <aside className="card flex flex-col gap-4 self-start p-6">
          <span className="text-xs uppercase tracking-[0.2em] text-text-muted">
            Доступ до курсу
          </span>
          <span className="text-3xl font-semibold text-gold">
            {course.price === 0 ? 'Безкоштовно' : formatUah(course.price)}
          </span>
          <button
            type="button"
            disabled
            title="Оплата зʼявиться у наступній фазі"
            className="btn-primary cursor-not-allowed opacity-70"
          >
            Купити курс
          </button>
          <p className="text-xs text-text-dim">Прийом оплати буде підключено у наступній фазі.</p>
        </aside>
      </header>

      <section className="mt-16">
        <h2 className="text-2xl md:text-3xl">Програма курсу</h2>
        {course.lessons.length === 0 ? (
          <p className="mt-6 text-text-muted">Уроки незабаром.</p>
        ) : (
          <ol className="mt-8 space-y-3">
            {course.lessons.map((lesson, i) => (
              <li key={lesson.id} className="card flex items-start gap-4 p-5 hover:border-gold/30">
                <span className="font-mono text-xs text-text-dim">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg">{lesson.title}</h3>
                    {lesson.isFree && (
                      <span className="rounded-full bg-gold-soft px-2 py-0.5 text-[10px] uppercase tracking-wider text-gold">
                        безкоштовно
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-text-muted">
                    {LESSON_TYPE_LABEL[lesson.type]}
                    {lesson.type === 'WEBINAR' && lesson.webinarAt && (
                      <span className="ml-2 normal-case tracking-normal text-violet">
                        {formatWebinarDate(lesson.webinarAt)}
                      </span>
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
