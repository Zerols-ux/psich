// Make sure tests don't accidentally hit a real production env.
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET ??= 'test-access-secret-1234567890';
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret-1234567890';
process.env.DATABASE_URL ??= 'postgresql://psich:psich@localhost:5432/psich?schema=public';
