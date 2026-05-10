'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export function Hero() {
  return (
    <section className="relative isolate flex min-h-[90vh] flex-col items-center justify-center overflow-hidden px-6 py-32 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-glow blur-2xl"
      />

      <motion.span
        className="badge-outline"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        Психологія · Розвиток · Трансформація
      </motion.span>

      <motion.h1
        className="mt-8 max-w-3xl text-5xl leading-tight md:text-6xl"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1 }}
      >
        Зміни своє <span className="text-gold">мислення</span> — зміни своє життя
      </motion.h1>

      <motion.p
        className="mt-6 max-w-xl text-base leading-relaxed text-text-muted md:text-lg"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
      >
        Авторські курси з психології для тих, хто готовий до глибоких змін. Практичні інструменти,
        живі вебінари, підтримка спільноти.
      </motion.p>

      <motion.div
        className="mt-12 flex flex-wrap items-center justify-center gap-4"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3 }}
      >
        <Link href="/courses" className="btn-primary">
          Переглянути курси
        </Link>
        <Link href="/courses?free=1" className="btn-secondary">
          Безкоштовний урок
        </Link>
      </motion.div>

      <span className="absolute bottom-8 text-[11px] tracking-[0.4em] text-text-dim">↓ SCROLL</span>
    </section>
  );
}
