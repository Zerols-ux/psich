import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const originalEnv = { ...process.env };

async function loadEnv(): Promise<typeof import('./env.js').env> {
  vi.resetModules();
  const mod = await import('./env.js');
  return mod.env;
}

describe('COOKIE_SECURE env parsing', () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it.each([
    ['true', true],
    ['1', true],
    ['false', false],
    ['0', false],
    ['', false],
    ['no', false],
    [undefined, false],
  ])('parses COOKIE_SECURE=%j as %j', async (input, expected) => {
    if (input === undefined) {
      delete process.env.COOKIE_SECURE;
    } else {
      process.env.COOKIE_SECURE = input;
    }
    const env = await loadEnv();
    expect(env.COOKIE_SECURE).toBe(expected);
  });
});
