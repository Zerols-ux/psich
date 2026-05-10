'use client';

import { useState } from 'react';
import { CourseCard } from '@/components/CourseCard';
import { MOCK_CATEGORIES, MOCK_COURSES } from '@/lib/mock-courses';

export default function CoursesPage() {
  const [active, setActive] = useState<(typeof MOCK_CATEGORIES)[number]>('Всі');

  const courses =
    active === 'Всі' ? MOCK_COURSES : MOCK_COURSES.filter((c) => c.category === active);

  return (
    <div className="mx-auto max-w-6xl px-6 py-20 md:px-10">
      <h1 className="text-4xl md:text-5xl">
        Всі <span className="text-gold">курси</span>
      </h1>
      <p className="mt-3 text-text-muted">Оберіть свій шлях до змін</p>

      <div className="mt-10 flex flex-wrap gap-3">
        {MOCK_CATEGORIES.map((category) => {
          const isActive = active === category;
          return (
            <button
              key={category}
              type="button"
              onClick={() => setActive(category)}
              className={`rounded-full border px-5 py-2 text-xs uppercase tracking-wide transition ${
                isActive
                  ? 'border-gold text-gold'
                  : 'border-card-border text-text-muted hover:text-text'
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>

      {courses.length === 0 && (
        <p className="mt-16 text-center text-text-muted">Курсів у цій категорії поки немає.</p>
      )}
    </div>
  );
}
