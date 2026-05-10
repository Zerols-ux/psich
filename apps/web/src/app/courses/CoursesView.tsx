'use client';

import { useMemo, useState } from 'react';
import type { Category, CourseSummary } from '@psich/types';
import { CourseCard } from '@/components/CourseCard';

interface Props {
  initialCourses: CourseSummary[];
  categories: Category[];
}

const ALL = '__all__';

export function CoursesView({ initialCourses, categories }: Props) {
  const [active, setActive] = useState<string>(ALL);

  const filtered = useMemo(() => {
    if (active === ALL) return initialCourses;
    return initialCourses.filter((c) => c.category?.slug === active);
  }, [active, initialCourses]);

  return (
    <>
      <div className="mt-10 flex flex-wrap gap-3">
        <FilterButton active={active === ALL} onClick={() => setActive(ALL)} label="Всі" />
        {categories.map((c) => (
          <FilterButton
            key={c.id}
            active={active === c.slug}
            onClick={() => setActive(c.slug)}
            label={c.name}
          />
        ))}
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="mt-16 text-center text-text-muted">
          {initialCourses.length === 0
            ? 'Курси з’являться найближчим часом.'
            : 'Курсів у цій категорії поки немає.'}
        </p>
      )}
    </>
  );
}

function FilterButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-5 py-2 text-xs uppercase tracking-wide transition ${
        active ? 'border-gold text-gold' : 'border-card-border text-text-muted hover:text-text'
      }`}
    >
      {label}
    </button>
  );
}
