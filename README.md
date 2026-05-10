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

# 5. Заповнити демо-даними (категорії + 4 курси)
npm run db:seed

# 6. Запустити всі застосунки в dev-режимі (Turborepo)
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
| `npm run -w @psich/api test`        | Vitest + supertest для API                         |
| `npm run docker:up` / `docker:down` | Підняти / зупинити Postgres                        |
| `npm run db:migrate`                | `prisma migrate dev` у `apps/api`                  |
| `npm run db:push`                   | `prisma db push` (без міграції — для прототипу)    |
| `npm run db:seed`                   | Заповнити БД демо-категоріями та курсами           |

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

## Auth (Phase 2.A)

Доступні endpointи (всі повертають JSON):

| Метод  | URL                  | Опис                                                        |
| ------ | -------------------- | ----------------------------------------------------------- |
| `POST` | `/api/auth/register` | Створює користувача, повертає access token + refresh cookie |
| `POST` | `/api/auth/login`    | Логін за email + password                                   |
| `POST` | `/api/auth/refresh`  | Обмінює refresh cookie на нову пару токенів (rotation)      |
| `POST` | `/api/auth/logout`   | Відкликає refresh-token та очищає cookie                    |
| `GET`  | `/api/auth/me`       | Повертає поточного користувача за Bearer-token              |

- **Access token** — JWT (по замовчуванню 15 хвилин), фронт тримає в памʼяті (`AuthProvider`).
- **Refresh token** — випадкова байтівка (`base64url`), зберігається в httpOnly cookie `psy_refresh`; в базі — лише SHA-256 хеш (`refresh_tokens`).
- **Rotation** — кожен `/refresh` видає новий токен і позначає старий як `revoked_at`. Повторне використання відкликаного токена визнається як reuse і відкликає всі сесії користувача.
- **Паролі** — bcrypt (12 rounds), зберігаються в `users.password_hash`.

Для production CORS рекомендовано виставити `COOKIE_SECURE=true` і явний `COOKIE_DOMAIN`.

## Courses (Phase 2.B.1)

Каталог курсів і сторінка курсу — публічні; запис/редагування — лише для адміністратора (`User.role = ADMIN`).

| Метод    | URL                              | Доступ                       |
| -------- | -------------------------------- | ---------------------------- |
| `GET`    | `/api/categories`                | public                       |
| `POST`   | `/api/categories`                | admin                        |
| `PATCH`  | `/api/categories/:id`            | admin                        |
| `DELETE` | `/api/categories/:id`            | admin                        |
| `GET`    | `/api/courses?category=&search=` | public, тільки `isPublished` |
| `GET`    | `/api/courses/:slug`             | public, тільки `isPublished` |
| `GET`    | `/api/courses/admin`             | admin (включно з draft)      |
| `POST`   | `/api/courses`                   | admin                        |
| `PATCH`  | `/api/courses/:id`               | admin                        |
| `DELETE` | `/api/courses/:id`               | admin                        |
| `POST`   | `/api/courses/:courseId/lessons` | admin                        |
| `PATCH`  | `/api/courses/lessons/:id`       | admin                        |
| `DELETE` | `/api/courses/lessons/:id`       | admin                        |

Для анонімних користувачів `GET /api/courses/:slug` повертає `contentMd` і `youtubeUrl` тільки для `isFree: true` уроків — це гарантує, що повний матеріал доступний лише після оплати.

Щоб надати акаунту роль адміністратора локально:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'you@example.com';
```

## Roadmap

- **Phase 1 — Foundation:** monorepo, базові сторінки `apps/web`, skeleton `apps/admin`, healthcheck `apps/api`, Prisma schema, dev-середовище.
- **Phase 2.A — Auth foundation (поточний PR):** JWT + bcrypt + refresh-token rotation, `/api/auth/*`, AuthProvider у web, сторінки `/login`, `/register`, захищений `/cabinet`, Vitest+supertest.
- **Phase 2.B:** Google OAuth, CRUD курсів/уроків/категорій, сторінка курсу.
- **Phase 3:** Платежі — LiqPay + Monobank Acquiring, ідемпотентний webhook, payment status polling.
- **Phase 4:** Lesson player (YouTube/Markdown/PDF/Webinar), `LessonProgress`, генерація PDF-сертифікатів.
- **Phase 5:** Адмін-панель (CRUD, користувачі, замовлення, аналітика, промокоди, email, блог).
- **Phase 6:** Коментарі, безкоштовні уроки, поліровка UX.

## Ліцензія

Proprietary. Внутрішній проект.
