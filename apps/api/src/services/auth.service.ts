import { Prisma, type PrismaClient, type User } from '@prisma/client';
import { HttpError } from '../middleware/errorHandler.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { generateRefreshToken, hashRefreshToken, signAccessToken } from '../lib/tokens.js';
import { env } from '../env.js';

export interface AuthContext {
  prisma: PrismaClient;
  userAgent?: string | undefined;
  ip?: string | undefined;
}

export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken: string;
}

function refreshExpiry(): Date {
  return new Date(Date.now() + env.REFRESH_TOKEN_TTL_SECONDS * 1000);
}

async function createSession(ctx: AuthContext, user: User): Promise<AuthSession> {
  const { token, tokenHash } = generateRefreshToken();
  await ctx.prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: refreshExpiry(),
      userAgent: ctx.userAgent ?? null,
      ip: ctx.ip ?? null,
    },
  });
  const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });
  return { user, accessToken, refreshToken: token };
}

export async function register(
  ctx: AuthContext,
  input: { email: string; name: string; password: string },
): Promise<AuthSession> {
  const email = input.email.toLowerCase().trim();
  const existing = await ctx.prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new HttpError(409, 'User with this email already exists');
  }
  const passwordHash = await hashPassword(input.password);
  let user: User;
  try {
    user = await ctx.prisma.user.create({
      data: { email, name: input.name.trim(), passwordHash },
    });
  } catch (err) {
    // Two concurrent registrations with the same email can both pass the
    // findUnique check above. The unique constraint on `email` then surfaces a
    // P2002 from the second create — translate it back to a clean 409.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new HttpError(409, 'User with this email already exists');
    }
    throw err;
  }
  return createSession(ctx, user);
}

export async function login(
  ctx: AuthContext,
  input: { email: string; password: string },
): Promise<AuthSession> {
  const email = input.email.toLowerCase().trim();
  const user = await ctx.prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    throw new HttpError(401, 'Invalid email or password');
  }
  const ok = await verifyPassword(input.password, user.passwordHash);
  if (!ok) {
    throw new HttpError(401, 'Invalid email or password');
  }
  return createSession(ctx, user);
}

/**
 * Rotates the refresh token: revokes the presented one and issues a fresh pair.
 * Detects reuse of a previously-revoked token and revokes all sessions for the
 * user as a precaution.
 */
export async function rotateRefreshToken(ctx: AuthContext, rawToken: string): Promise<AuthSession> {
  const tokenHash = hashRefreshToken(rawToken);
  const stored = await ctx.prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!stored) {
    throw new HttpError(401, 'Refresh token not recognized');
  }
  if (stored.expiresAt.getTime() < Date.now()) {
    throw new HttpError(401, 'Refresh token expired');
  }
  if (stored.revokedAt) {
    await ctx.prisma.refreshToken.updateMany({
      where: { userId: stored.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw new HttpError(401, 'Refresh token reuse detected; all sessions revoked');
  }

  const user = await ctx.prisma.user.findUnique({ where: { id: stored.userId } });
  if (!user) {
    throw new HttpError(401, 'User no longer exists');
  }

  const next = generateRefreshToken();
  const created = await ctx.prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: next.tokenHash,
      expiresAt: refreshExpiry(),
      userAgent: ctx.userAgent ?? null,
      ip: ctx.ip ?? null,
    },
  });
  await ctx.prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date(), replacedBy: created.id },
  });

  const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });
  return { user, accessToken, refreshToken: next.token };
}

export async function logout(ctx: AuthContext, rawToken: string | undefined): Promise<void> {
  if (!rawToken) return;
  const tokenHash = hashRefreshToken(rawToken);
  await ctx.prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export function publicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
