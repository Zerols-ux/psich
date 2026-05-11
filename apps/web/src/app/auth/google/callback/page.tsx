'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { AuthCard } from '@/components/AuthCard';
import { useAuth } from '@/lib/auth-context';

function GoogleCallbackInner() {
  const router = useRouter();
  const search = useSearchParams();
  const { refreshSession } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const status = search.get('status');
  const message = search.get('message');

  useEffect(() => {
    if (status === 'error') {
      setError(humanize(message));
      return;
    }
    // The API set our `psy_refresh` cookie; ask the API for a fresh access
    // token + user payload, then drop the user into the cabinet.
    refreshSession().then((ok) => {
      if (ok) {
        router.replace('/cabinet');
      } else {
        setError('Не вдалося завершити вхід через Google. Спробуйте ще раз.');
      }
    });
  }, [status, message, refreshSession, router]);

  if (error) {
    return (
      <AuthCard
        title="Вхід через Google"
        subtitle="Сталася помилка при вході."
        footer={
          <Link href="/login" className="text-gold hover:underline">
            Повернутися до входу
          </Link>
        }
      >
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Вхід через Google"
      subtitle="Завершуємо вхід…"
      footer={<span className="text-text-muted">Це займе кілька секунд.</span>}
    >
      <div className="flex h-12 items-center justify-center">
        <div className="h-2 w-2 animate-pulse rounded-full bg-gold" />
      </div>
    </AuthCard>
  );
}

function humanize(message: string | null): string {
  switch (message) {
    case 'access_denied':
      return 'Ви скасували вхід через Google. Спробуйте ще раз або увійдіть email-ом.';
    case 'google_auth_failed':
      return 'Помилка обміну з Google. Спробуйте ще раз через хвилину.';
    default:
      return 'Не вдалося увійти через Google.';
  }
}

export default function GoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <AuthCard
          title="Вхід через Google"
          subtitle="Завершуємо вхід…"
          footer={<span className="text-text-muted">Зачекайте, будь ласка.</span>}
        >
          <div className="flex h-12 items-center justify-center">
            <div className="h-2 w-2 animate-pulse rounded-full bg-gold" />
          </div>
        </AuthCard>
      }
    >
      <GoogleCallbackInner />
    </Suspense>
  );
}
