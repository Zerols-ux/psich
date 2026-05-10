export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-3xl">
        Адмін-<span className="text-gold">панель</span>
      </h1>
      <p className="mt-2 text-sm text-text-dim">
        Phase 1 skeleton. Реальні модулі підключаються у Phase 5.
      </p>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {[
          { label: 'Курси', value: '—' },
          { label: 'Учні', value: '—' },
          { label: 'Замовлення', value: '—' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-card-border bg-card p-5">
            <div className="text-3xl font-semibold text-gold">{stat.value}</div>
            <div className="mt-1 text-xs uppercase tracking-wider text-text-dim">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-lg border border-card-border bg-card p-6 text-sm text-text-muted">
        <p>
          Тут зʼявиться графік продажів, активних учнів і популярних курсів. Поки що це заглушка для
          перевірки маршрутизації та стилів.
        </p>
      </div>
    </div>
  );
}
