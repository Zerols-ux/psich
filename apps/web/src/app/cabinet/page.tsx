'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';

export default function CabinetPage() {
  const { user, status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login?next=/cabinet');
    }
  }, [status, router]);

  if (status !== 'authenticated' || !user) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-text-muted">
        <p className="font-serif text-2xl text-text">Завантажуємо ваш кабінет…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-16 md:px-10">
      <header>
        <p className="text-xs uppercase tracking-[0.4em] text-gold">Особистий кабінет</p>
        <h1 className="mt-3 font-serif text-4xl text-text">
          Вітаю, <span className="text-gold">{user.name}</span>
        </h1>
        <p className="mt-3 max-w-2xl text-text-muted">
          Тут зʼявляться ваші куплені курси, прогрес уроків та сертифікати. Поки що — каркас.
          Реальні дані підключимо у наступних фазах.
        </p>
      </header>

      <section className="mt-12 grid gap-4 md:grid-cols-3">
        <Stat label="Курси" value="—" hint="Появляться після покупки" />
        <Stat label="Уроки пройдено" value="—" hint="Прогрес рахується автоматично" />
        <Stat label="Сертифікати" value="—" hint="Видаються по 100% курсу" />
      </section>

      <section className="mt-12 rounded-xl border border-card-border/60 bg-card/40 p-6">
        <h2 className="font-serif text-2xl text-text">Профіль</h2>
        <dl className="mt-4 grid gap-x-8 gap-y-3 text-sm md:grid-cols-2">
          <Row term="Email" value={user.email} />
          <Row term="Імʼя" value={user.name} />
          <Row term="Роль" value={user.role === 'ADMIN' ? 'Адміністратор' : 'Учень'} />
          <Row term="Зареєстровано" value={new Date(user.createdAt).toLocaleString('uk-UA')} />
        </dl>
      </section>

      <section className="mt-12">
        <Link href="/courses" className="text-sm text-gold hover:underline">
          ← Перейти до каталогу курсів
        </Link>
      </section>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border border-card-border/60 bg-card/40 p-6">
      <p className="text-xs uppercase tracking-widest text-text-muted">{label}</p>
      <p className="mt-2 font-serif text-3xl text-text">{value}</p>
      <p className="mt-2 text-xs text-text-muted">{hint}</p>
    </div>
  );
}

function Row({ term, value }: { term: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-widest text-text-muted">{term}</dt>
      <dd className="mt-1 text-text">{value}</dd>
    </div>
  );
}
