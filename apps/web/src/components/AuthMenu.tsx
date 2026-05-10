'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export function AuthMenu() {
  const { user, status, logout } = useAuth();
  const router = useRouter();

  if (status === 'loading') {
    return (
      <span className="hidden h-9 w-24 animate-pulse rounded bg-card-border/40 md:inline-block" />
    );
  }

  if (status === 'authenticated' && user) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/cabinet"
          className="hidden rounded border border-card-border/60 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-text transition hover:border-gold/60 hover:text-gold md:inline-block"
        >
          Кабінет
        </Link>
        <button
          type="button"
          onClick={async () => {
            await logout();
            router.push('/');
            router.refresh();
          }}
          className="rounded bg-card-border/40 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-text transition hover:bg-card-border/60"
        >
          Вийти
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className="rounded bg-gold px-5 py-2 text-xs font-semibold text-bg transition hover:bg-gold/90"
    >
      Увійти
    </Link>
  );
}
