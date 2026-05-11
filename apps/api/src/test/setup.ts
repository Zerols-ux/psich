// Make sure tests don't accidentally hit a real production env.
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET ??= 'test-access-secret-1234567890';
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret-1234567890';
process.env.DATABASE_URL ??= 'postgresql://psich:psich@localhost:5432/psich?schema=public';
// Force fake Google credentials inside the test process so the OAuth route
// test sees deterministic values regardless of what the developer (or CI) has
// in their shell. We never actually exchange tokens with Google during tests.
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
process.env.GOOGLE_REDIRECT_URI = 'http://localhost:4000/api/auth/google/callback';
process.env.WEB_APP_URL = 'http://localhost:3000';
