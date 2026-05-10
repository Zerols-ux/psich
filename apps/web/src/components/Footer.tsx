export function Footer() {
  return (
    <footer className="border-t border-card-border/40 bg-bg-alt/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-10 text-sm text-text-muted md:flex-row md:items-center md:justify-between md:px-10">
        <div className="font-serif uppercase tracking-[0.32em] text-gold">Psyplatform</div>
        <p>© {new Date().getFullYear()} Psyplatform. Всі права захищено.</p>
        <p className="text-text-dim">Зроблено з турботою для української спільноти.</p>
      </div>
    </footer>
  );
}
