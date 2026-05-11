'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { AuthCard } from '@/components/AuthCard';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import { useAuth } from '@/lib/auth-context';
import { ApiCallError } from '@/lib/api';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register({ email, name, password });
      router.push('/cabinet');
      router.refresh();
    } catch (err) {
      if (err instanceof ApiCallError && err.status === 409) {
        setError('Користувач з таким email вже існує.');
      } else if (err instanceof ApiCallError && err.status === 400) {
        setError('Перевірте поля: пароль має містити щонайменше 8 символів.');
      } else if (err instanceof ApiCallError) {
        setError(err.message);
      } else {
        setError('Не вдалося створити акаунт. Спробуйте ще раз.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Реєстрація"
      subtitle="Створіть акаунт, щоб придбати курс і отримати доступ до уроків."
      footer={
        <>
          Уже є акаунт?{' '}
          <Link href="/login" className="text-gold hover:underline">
            Увійти
          </Link>
        </>
      }
    >
      <div className="space-y-6">
        <GoogleSignInButton />
        <div className="relative text-center text-xs uppercase tracking-widest text-text-muted">
          <span className="absolute inset-x-0 top-1/2 -z-10 h-px bg-card-border/60" aria-hidden />
          <span className="bg-card/60 px-3">або</span>
        </div>
        <form className="space-y-4" onSubmit={onSubmit} noValidate>
          <Field
            label="Імʼя"
            autoComplete="name"
            value={name}
            onChange={setName}
            required
            minLength={2}
          />
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
            autoComplete="new-password"
            value={password}
            onChange={setPassword}
            required
            minLength={8}
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
            {submitting ? 'Створюємо…' : 'Зареєструватись'}
          </button>
        </form>
      </div>
    </AuthCard>
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
