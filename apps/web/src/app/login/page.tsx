'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';
import { AuthCard } from '@/components/AuthCard';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import { useAuth } from '@/lib/auth-context';
import { ApiCallError } from '@/lib/api';

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get('next') ?? '/cabinet';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.push(next);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiCallError && err.status === 401) {
        setError('Невірний email або пароль.');
      } else if (err instanceof ApiCallError) {
        setError(err.message);
      } else {
        setError('Не вдалося увійти. Перевірте підключення і спробуйте ще раз.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <GoogleSignInButton next={next} />
      <div className="relative text-center text-xs uppercase tracking-widest text-text-muted">
        <span className="absolute inset-x-0 top-1/2 -z-10 h-px bg-card-border/60" aria-hidden />
        <span className="bg-card/60 px-3">або</span>
      </div>
      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={setEmail}
          required
        />
        <Field
          label="Пароль"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
          required
          minLength={1}
        />
        {error ? (
          <p role="alert" className="text-sm text-red-400">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-gold py-3 text-sm font-semibold uppercase tracking-widest text-bg transition hover:bg-gold/90 disabled:opacity-60"
        >
          {submitting ? 'Входимо…' : 'Увійти'}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-widest text-text-muted">{label}</span>
      <input
        {...rest}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-card-border/60 bg-bg/40 px-4 py-3 text-sm text-text outline-none transition focus:border-gold/70"
      />
    </label>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <AuthCard
        title="Вхід"
        subtitle="Раді бачити вас знову. Увійдіть, щоб продовжити навчання."
        footer={
          <>
            Ще немає акаунту?{' '}
            <Link href="/register" className="text-gold hover:underline">
              Зареєструйтесь
            </Link>
          </>
        }
      >
        <LoginForm />
      </AuthCard>
    </Suspense>
  );
}
