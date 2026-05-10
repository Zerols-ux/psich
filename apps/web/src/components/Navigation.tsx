import Link from 'next/link';

const links = [
  { href: '/courses', label: 'Курси' },
  { href: '/#about', label: 'Про мене' },
  { href: '/blog', label: 'Блог' },
  { href: '/#contact', label: 'Контакти' },
];

export function Navigation() {
  return (
    <header className="sticky top-0 z-50 border-b border-card-border/40 bg-bg/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 md:px-10">
        <Link href="/" className="font-serif text-xl uppercase tracking-[0.32em] text-gold">
          Psyplatform
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-text-muted md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-text">
              {link.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/login"
          className="rounded bg-gold px-5 py-2 text-xs font-semibold text-bg transition hover:bg-gold/90"
        >
          Увійти
        </Link>
      </div>
    </header>
  );
}
