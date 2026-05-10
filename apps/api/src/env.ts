import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(4000),
  API_HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z
    .string()
    .url()
    .default('postgresql://psich:psich@localhost:5432/psich?schema=public'),
  CORS_ORIGINS: z.string().default('http://localhost:3000,http://localhost:3001'),
  JWT_ACCESS_SECRET: z.string().min(16).default('dev-access-secret-change-me-pls'),
  JWT_REFRESH_SECRET: z.string().min(16).default('dev-refresh-secret-change-me-pls'),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(60 * 15),
  REFRESH_TOKEN_TTL_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(60 * 60 * 24 * 30),
  COOKIE_DOMAIN: z.string().optional(),
  // z.coerce.boolean() uses Boolean(), which treats "false" as truthy. Parse the
  // env string explicitly so COOKIE_SECURE=false works as intended.
  COOKIE_SECURE: z
    .string()
    .default('false')
    .transform((v) => v === 'true' || v === '1'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('[env] invalid environment configuration:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment configuration');
}

export const env = parsed.data;

// Prisma Client reads DATABASE_URL directly from process.env at the time it
// connects to the database; it does not go through this zod schema. If the
// caller did not export DATABASE_URL (e.g. fresh dev clone with no .env file
// inside apps/api/), mirror the validated default back into process.env so
// Prisma can pick it up.
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = env.DATABASE_URL;
}

export const corsOrigins = env.CORS_ORIGINS.split(',')
  .map((s) => s.trim())
  .filter(Boolean);
