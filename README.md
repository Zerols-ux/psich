# Psyplatform (`psich`)

Українськомовна освітня платформа для продажу та проходження психологічних курсів. Monorepo на базі Turborepo + npm workspaces.

> **Brand placeholder:** `PSYPLATFORM`. Фінальна назва та логотип будуть зафіксовані перед запуском.

## Структура

```
psich/
├── apps/
│   ├── web/     # Next.js 14 — публічний сайт + кабінет учня
│   ├── admin/   # Next.js 14 — адмін-панель (окремий застосунок)
│   └── api/     # Express + TypeScript — REST API
├── packages/
│   └── types/   # Спільні TypeScript типи між web/admin/api
├── docker-compose.yml
└── turbo.json
```

## Технологічний стек

| Шар           | Технологія                                                       |
| ------------- | ---------------------------------------------------------------- |
| Frontend      | Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion |
| Backend       | Node.js 20+, Express, TypeScript                                 |
| ORM / DB      | Prisma + PostgreSQL 16                                           |
| Monorepo      | Turborepo + npm workspaces                                       |
| Lint / Format | ESLint, Prettier                                                 |

## Швидкий старт

### Передумови

- Node.js **20+** (див. `.nvmrc`)
- npm **10+**
- Docker + Docker Compose (для локальної бази)

### Перший запуск

```bash
# 1. Залежності
npm install

# 2. Скопіювати env-файл
cp .env.example .env

# 3. Підняти Postgres у Docker
npm run docker:up

# 4. Згенерувати Prisma Client та накатати міграції
npm run db:generate
npm run db:migrate

# 5. Запустити всі застосунки в dev-режимі (Turborepo)
npm run dev
```

Після старту:

- `apps/web` — http://localhost:3000
- `apps/admin` — http://localhost:3001
- `apps/api` — http://localhost:4000 (`/health`)

### Корисні команди

| Команда                             | Опис                                               |
| ----------------------------------- | -------------------------------------------------- |
| `npm run dev`                       | Запустити web + admin + api паралельно (Turborepo) |
| `npm run build`                     | Зібрати всі застосунки                             |
| `npm run lint`                      | ESLint у всіх workspace                            |
| `npm run typecheck`                 | TypeScript перевірка у всіх workspace              |
| `npm run format`                    | Prettier — відформатувати все                      |
| `npm run docker:up` / `docker:down` | Підняти / зупинити Postgres                        |
| `npm run db:migrate`                | `prisma migrate dev` у `apps/api`                  |
| `npm run db:push`                   | `prisma db push` (без міграції — для прототипу)    |

## Дизайн-система

| Токен                         | Значення             |
| ----------------------------- | -------------------- |
| Background                    | `#0D0D0D`, `#111111` |
| Primary accent (золото)       | `#C9A84C`            |
| Secondary accent (фіолетовий) | `#7B2FBE`            |
| Text primary                  | `#F5F5F5`            |
| Text muted                    | `#A0A0A0`            |
| Card                          | `#1A1A1A`, `#222222` |
| Heading font                  | Playfair Display     |
| Body font                     | Inter                |

## Roadmap

- **Phase 1 — Foundation (поточний PR):** monorepo, базові сторінки `apps/web`, skeleton `apps/admin`, healthcheck `apps/api`, Prisma schema, dev-середовище.
- **Phase 2:** Auth (JWT + Google OAuth), CRUD курсів/уроків/категорій, сторінка курсу, базовий захищений кабінет.
- **Phase 3:** Платежі — LiqPay + Monobank Acquiring, ідемпотентний webhook, payment status polling.
- **Phase 4:** Lesson player (YouTube/Markdown/PDF/Webinar), `LessonProgress`, генерація PDF-сертифікатів.
- **Phase 5:** Адмін-панель (CRUD, користувачі, замовлення, аналітика, промокоди, email, блог).
- **Phase 6:** Коментарі, безкоштовні уроки, поліровка UX.

## Ліцензія

Proprietary. Внутрішній проект.
