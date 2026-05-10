import Link from 'next/link';
import type { ReactNode } from 'react';

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-200px)] max-w-md flex-col justify-center px-6 py-16">
      <div className="rounded-2xl border border-card-border/60 bg-card/60 p-10 shadow-xl">
        <Link
          href="/"
          className="mb-8 block text-center font-serif text-xs uppercase tracking-[0.4em] text-gold"
        >
          Psyplatform
        </Link>
        <h1 className="font-serif text-3xl text-text">{title}</h1>
        <p className="mt-2 text-sm text-text-muted">{subtitle}</p>
        <div className="mt-8">{children}</div>
        <div className="mt-6 text-center text-sm text-text-muted">{footer}</div>
      </div>
    </div>
  );
}
