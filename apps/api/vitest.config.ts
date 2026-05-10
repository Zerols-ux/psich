import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['src/**/*.test.ts'],
    setupFiles: ['./src/test/setup.ts'],
    pool: 'forks',
    forks: { singleFork: true },
    // We share a single Postgres database across all test files and TRUNCATE
    // every table in beforeEach, so test files MUST run sequentially —
    // otherwise Foreign Key constraints (e.g. refresh_tokens.user_id) violate
    // when one file truncates users while another is mid-test.
    fileParallelism: false,
    hookTimeout: 30_000,
    testTimeout: 30_000,
  },
});
