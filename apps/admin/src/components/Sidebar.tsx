import Link from 'next/link';

const navItems = [
  { href: '/', label: 'Дашборд', icon: '📊', active: true },
  { href: '/courses', label: 'Курси', icon: '📚' },
  { href: '/lessons', label: 'Уроки', icon: '🎬' },
  { href: '/users', label: 'Користувачі', icon: '👥' },
  { href: '/orders', label: 'Замовлення', icon: '💳' },
  { href: '/promo', label: 'Промокоди', icon: '🎟️' },
  { href: '/blog', label: 'Блог', icon: '📝' },
];

export function Sidebar() {
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-line bg-bg-alt py-8">
      <div className="px-6 pb-8 font-serif text-base uppercase tracking-[0.32em] text-gold">
        Psyplatform
      </div>

      <nav className="flex flex-col">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-6 py-3 text-sm transition ${
              item.active
                ? 'border-l-2 border-gold bg-gold-soft text-gold'
                : 'text-text-muted hover:text-text'
            }`}
          >
            <span aria-hidden>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-auto px-6 text-xs text-text-dim">
        Phase 1 skeleton — модулі підключаються поетапно.
      </div>
    </aside>
  );
}
