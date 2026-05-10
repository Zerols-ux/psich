'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { formatUah, type MockCourse } from '@/lib/mock-courses';

export function CourseCard({ course }: { course: MockCourse }) {
  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 200, damping: 22 }}
      className="card group flex flex-col overflow-hidden hover:border-gold/40 hover:shadow-glow"
    >
      <Link href={`/courses/${course.slug}`} className="flex h-full flex-col">
        <div className="flex h-44 items-center justify-center bg-gradient-to-br from-[#1A1A2E] to-[#2D1B4E] text-5xl text-violet">
          <span aria-hidden>{course.icon}</span>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div className="text-[11px] uppercase tracking-[0.2em] text-violet">
            {course.category}
          </div>

          <h3 className="mt-3 flex items-start gap-2 text-xl leading-snug">
            <span>{course.title}</span>
            {course.hasFreeLessons && (
              <span className="rounded-full bg-gold-soft px-2 py-0.5 text-[10px] uppercase tracking-wider text-gold">
                є безкоштовні
              </span>
            )}
          </h3>

          <p className="mt-3 text-sm leading-relaxed text-text-muted">{course.description}</p>

          <div className="mt-auto flex items-center justify-between border-t border-card-border pt-4">
            <span className="text-2xl font-semibold text-gold">{formatUah(course.price)}</span>
            <span className="text-xs text-text-dim">{course.lessonsCount} уроків</span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
