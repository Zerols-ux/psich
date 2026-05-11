import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { corsOrigins, env } from './env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { passport } from './lib/passport.js';
import authRouter from './routes/auth.js';
import categoriesRouter from './routes/categories.js';
import coursesRouter from './routes/courses.js';
import { healthRouter } from './routes/health.js';

export function createServer(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(
    cors({
      origin: corsOrigins,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  // Stateless passport — we never call passport.session(), the Google
  // strategy hands its result straight to our route which mints our JWT.
  app.use(passport.initialize());

  if (env.NODE_ENV !== 'test') {
    app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
  }

  app.use(healthRouter);
  app.use('/api', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/categories', categoriesRouter);
  app.use('/api/courses', coursesRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
