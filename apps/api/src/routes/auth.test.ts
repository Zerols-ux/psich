import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import type { Profile } from 'passport-google-oauth20';
import { createServer } from '../server.js';
import { prisma } from '../lib/prisma.js';
import { resetDb } from '../test/db.js';
import { REFRESH_COOKIE_NAME } from '../lib/cookies.js';
import { normalizeProfile } from '../lib/passport.js';
import { loginOrRegisterWithGoogle } from '../services/auth.service.js';

let app: Express;

beforeAll(() => {
  app = createServer();
});

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await prisma.$disconnect();
});

const VALID = {
  email: 'olha@example.com',
  name: 'Olha Petrenko',
  password: 'SuperSecret123',
};

function extractRefreshCookie(res: request.Response): string | undefined {
  const raw = res.headers['set-cookie'];
  const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const cookie = list.find((c: string) => c.startsWith(`${REFRESH_COOKIE_NAME}=`));
  return cookie?.split(';')[0];
}

describe('POST /api/auth/register', () => {
  it('creates a user and returns access token + refresh cookie', async () => {
    const res = await request(app).post('/api/auth/register').send(VALID);
    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ email: VALID.email, role: 'STUDENT' });
    expect(res.body.user.id).toEqual(expect.any(String));
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(extractRefreshCookie(res)).toMatch(`${REFRESH_COOKIE_NAME}=`);
  });

  it('rejects duplicate email with 409', async () => {
    await request(app).post('/api/auth/register').send(VALID).expect(201);
    const res = await request(app).post('/api/auth/register').send(VALID);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('returns 409 (not 500) when two concurrent registrations race on the same email', async () => {
    // Fire both before either resolves so they both pass the findUnique check
    // and one of them hits the unique-constraint error path.
    const [a, b] = await Promise.all([
      request(app).post('/api/auth/register').send(VALID),
      request(app).post('/api/auth/register').send(VALID),
    ]);
    const statuses = [a.status, b.status].sort((x, y) => x - y);
    expect(statuses).toEqual([201, 409]);
    const winner = a.status === 201 ? a : b;
    expect(winner.body.user.email).toBe(VALID.email);
  });

  it('rejects payload that fails Zod validation with 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', name: 'A', password: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
    expect(res.body.error.details.fieldErrors).toBeDefined();
  });
});

describe('POST /api/auth/login', () => {
  it('returns access token for valid credentials', async () => {
    await request(app).post('/api/auth/register').send(VALID).expect(201);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: VALID.email, password: VALID.password });
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(VALID.email);
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(extractRefreshCookie(res)).toBeDefined();
  });

  it('returns 401 for wrong password', async () => {
    await request(app).post('/api/auth/register').send(VALID).expect(201);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: VALID.email, password: 'WrongPassword999' });
    expect(res.status).toBe(401);
  });

  it('returns 401 for unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ghost@example.com', password: 'whatever123' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('requires Authorization header', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns current user for valid bearer token', async () => {
    const reg = await request(app).post('/api/auth/register').send(VALID).expect(201);
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${reg.body.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(VALID.email);
  });

  it('rejects invalid bearer token', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer not-a-jwt');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/refresh', () => {
  it('rotates the refresh token and issues a new access token', async () => {
    const reg = await request(app).post('/api/auth/register').send(VALID).expect(201);
    const oldCookie = extractRefreshCookie(reg);
    expect(oldCookie).toBeDefined();

    const res = await request(app).post('/api/auth/refresh').set('Cookie', oldCookie!);
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toEqual(expect.any(String));

    const newCookie = extractRefreshCookie(res);
    expect(newCookie).toBeDefined();
    expect(newCookie).not.toBe(oldCookie);
  });

  it('returns 401 and clears the cookie when no cookie is present', async () => {
    const res = await request(app).post('/api/auth/refresh');
    expect(res.status).toBe(401);
  });

  it('detects refresh token reuse and revokes all sessions', async () => {
    const reg = await request(app).post('/api/auth/register').send(VALID).expect(201);
    const oldCookie = extractRefreshCookie(reg)!;

    // First rotation succeeds
    const r1 = await request(app).post('/api/auth/refresh').set('Cookie', oldCookie);
    expect(r1.status).toBe(200);

    // Replaying the now-revoked cookie must fail
    const r2 = await request(app).post('/api/auth/refresh').set('Cookie', oldCookie);
    expect(r2.status).toBe(401);

    // The freshly-issued cookie from r1 should also have been revoked
    const r3 = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', extractRefreshCookie(r1)!);
    expect(r3.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('revokes refresh token and clears cookie', async () => {
    const reg = await request(app).post('/api/auth/register').send(VALID).expect(201);
    const cookie = extractRefreshCookie(reg)!;

    const out = await request(app).post('/api/auth/logout').set('Cookie', cookie);
    expect(out.status).toBe(204);

    // Refresh with the same token must now fail
    const after = await request(app).post('/api/auth/refresh').set('Cookie', cookie);
    expect(after.status).toBe(401);
  });
});

describe('GET /api/auth/google', () => {
  it('redirects to Google with the configured client_id and scopes', async () => {
    const res = await request(app).get('/api/auth/google').redirects(0);
    expect(res.status).toBe(302);
    const loc = res.headers.location as string;
    expect(loc).toMatch(/^https:\/\/accounts\.google\.com\/o\/oauth2\/v2\/auth/);
    const parsed = new URL(loc);
    expect(parsed.searchParams.get('client_id')).toBe('test-google-client-id');
    expect(parsed.searchParams.get('response_type')).toBe('code');
    expect(parsed.searchParams.get('scope')).toContain('email');
    expect(parsed.searchParams.get('scope')).toContain('profile');
    expect(parsed.searchParams.get('redirect_uri')).toBe(
      'http://localhost:4000/api/auth/google/callback',
    );
  });
});

const GOOGLE_PROFILE = {
  googleId: 'google-sub-123',
  email: 'olha@gmail.com',
  name: 'Olha Petrenko',
  avatarUrl: 'https://example.com/avatar.png',
};

function ctx() {
  return { prisma };
}

describe('loginOrRegisterWithGoogle', () => {
  it('creates a brand-new STUDENT user with no passwordHash when none exists', async () => {
    const session = await loginOrRegisterWithGoogle(ctx(), GOOGLE_PROFILE);
    expect(session.user.email).toBe(GOOGLE_PROFILE.email);
    expect(session.user.role).toBe('STUDENT');
    expect(session.user.googleId).toBe(GOOGLE_PROFILE.googleId);
    expect(session.user.passwordHash).toBeNull();
    expect(session.accessToken).toEqual(expect.any(String));
    expect(session.refreshToken).toEqual(expect.any(String));
  });

  it('returns the existing user when google_id already matches (idempotent)', async () => {
    const first = await loginOrRegisterWithGoogle(ctx(), GOOGLE_PROFILE);
    const second = await loginOrRegisterWithGoogle(ctx(), GOOGLE_PROFILE);
    expect(second.user.id).toBe(first.user.id);
    const count = await prisma.user.count({ where: { email: GOOGLE_PROFILE.email } });
    expect(count).toBe(1);
  });

  it('links googleId to an existing password user with the same email', async () => {
    const reg = await request(app).post('/api/auth/register').send(VALID).expect(201);
    const existingId = reg.body.user.id;

    const session = await loginOrRegisterWithGoogle(ctx(), {
      googleId: 'google-sub-456',
      email: VALID.email,
      name: VALID.name,
      avatarUrl: null,
    });
    expect(session.user.id).toBe(existingId);
    expect(session.user.googleId).toBe('google-sub-456');
    // Original password hash must NOT be wiped — they should still be able to
    // sign in with their password going forward.
    expect(session.user.passwordHash).not.toBeNull();
  });

  it('rejects logins on stored email if no googleId match and case differs (case-insensitive merge)', async () => {
    await request(app).post('/api/auth/register').send(VALID).expect(201);
    const session = await loginOrRegisterWithGoogle(ctx(), {
      googleId: 'google-sub-789',
      email: VALID.email.toUpperCase(),
      name: 'Olha',
      avatarUrl: null,
    });
    const count = await prisma.user.count({ where: { email: VALID.email } });
    expect(count).toBe(1);
    expect(session.user.googleId).toBe('google-sub-789');
  });
});

function makeProfile(overrides: {
  emailVerifiedJson?: boolean | string | undefined;
  emailVerifiedEntry?: boolean | string | undefined;
  email?: string | null;
}): Profile {
  return {
    id: 'g-1',
    provider: 'google',
    displayName: 'Olha',
    emails:
      overrides.email === null
        ? undefined
        : ([
            {
              value: overrides.email ?? 'olha@example.com',
              ...(overrides.emailVerifiedEntry !== undefined
                ? { verified: overrides.emailVerifiedEntry }
                : {}),
            },
          ] as Profile['emails']),
    _json: {
      email_verified: overrides.emailVerifiedJson,
    },
  } as unknown as Profile;
}

describe('normalizeProfile (Google email verification)', () => {
  it('accepts profiles with email_verified=true on _json', () => {
    const result = normalizeProfile(makeProfile({ emailVerifiedJson: true }));
    expect(result.email).toBe('olha@example.com');
  });

  it('accepts profiles with verified=true on the email entry', () => {
    const result = normalizeProfile(makeProfile({ emailVerifiedEntry: true }));
    expect(result.email).toBe('olha@example.com');
  });

  it('accepts string "true" from older passport responses', () => {
    const result = normalizeProfile(makeProfile({ emailVerifiedJson: 'true' }));
    expect(result.email).toBe('olha@example.com');
  });

  it('rejects profiles when email_verified is false', () => {
    expect(() => normalizeProfile(makeProfile({ emailVerifiedJson: false }))).toThrow(
      /not verified/,
    );
  });

  it('rejects profiles where the verified flag is absent (fail closed)', () => {
    expect(() => normalizeProfile(makeProfile({}))).toThrow(/not verified/);
  });

  it('rejects profiles that did not return an email', () => {
    expect(() => normalizeProfile(makeProfile({ email: null }))).toThrow(/did not return an email/);
  });
});
