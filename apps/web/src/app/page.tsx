import { Hero } from '@/components/Hero';
import { CourseCard } from '@/components/CourseCard';
import { ScrollReveal } from '@/components/ScrollReveal';
import { listCourses } from '@/lib/courses';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const featured = (await listCourses().catch(() => [])).slice(0, 3);

  return (
    <>
      <Hero />

      <section className="mx-auto max-w-6xl px-6 py-24 md:px-10">
        <ScrollReveal>
          <p className="text-xs uppercase tracking-[0.32em] text-gold">Featured</p>
          <h2 className="mt-4 text-4xl md:text-5xl">
            Популярні <span className="text-gold">курси</span>
          </h2>
          <p className="mt-3 max-w-xl text-text-muted">
            Найбільш затребувані програми, які допомогли тисячам людей пройти крізь власні внутрішні
            зміни.
          </p>
        </ScrollReveal>

        {featured.length > 0 ? (
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {featured.map((course, i) => (
              <ScrollReveal key={course.id} delay={i * 0.05}>
                <CourseCard course={course} />
              </ScrollReveal>
            ))}
          </div>
        ) : (
          <p className="mt-12 text-text-muted">
            Курси з’являться найближчим часом. Зайдіть до{' '}
            <a href="/courses" className="text-gold hover:underline">
              каталогу
            </a>
            .
          </p>
        )}
      </section>

      <section id="about" className="border-y border-card-border/40 bg-bg-alt/40 py-24">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 md:grid-cols-[1fr_1.4fr] md:px-10">
          <ScrollReveal>
            <div className="aspect-[4/5] rounded-xl bg-gradient-to-br from-[#1A1A2E] to-[#2D1B4E] shadow-glow" />
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <p className="text-xs uppercase tracking-[0.32em] text-gold">Про автора</p>
            <h2 className="mt-4 text-4xl md:text-5xl">
              Психологія, що працює <span className="text-gold">в реальному житті</span>
            </h2>
            <p className="mt-6 text-text-muted">
              Понад 10 років практики, тисячі сесій, авторські програми, які об’єднують сучасні
              наукові підходи з глибинною роботою. Курси створено для тих, хто хоче не лише розуміти
              себе, а й змінювати своє життя — поступово, послідовно, без поспіху.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-text-muted">
              <li className="flex gap-3">
                <span className="text-gold">●</span> Сертифікований психолог
              </li>
              <li className="flex gap-3">
                <span className="text-gold">●</span> Автор 4-х навчальних програм
              </li>
              <li className="flex gap-3">
                <span className="text-gold">●</span> Практик, що веде живі вебінари
              </li>
            </ul>
          </ScrollReveal>
        </div>
      </section>

      <section id="contact" className="mx-auto max-w-4xl px-6 py-24 text-center md:px-10">
        <ScrollReveal>
          <p className="text-xs uppercase tracking-[0.32em] text-gold">CTA</p>
          <h2 className="mt-4 text-4xl md:text-5xl">
            Готові розпочати <span className="text-gold">шлях</span>?
          </h2>
          <p className="mt-4 text-text-muted">
            Перегляньте каталог курсів і знайдіть свій. Перший урок у багатьох курсах —
            безкоштовний.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a href="/courses" className="btn-primary">
              До каталогу
            </a>
          </div>
        </ScrollReveal>
      </section>
    </>
  );
}
