import { env } from './env.js';
import { logger } from './lib/logger.js';
import { createServer } from './server.js';

const app = createServer();

const server = app.listen(env.API_PORT, env.API_HOST, () => {
  logger.info(
    { port: env.API_PORT, host: env.API_HOST, env: env.NODE_ENV },
    'Psyplatform API listening',
  );
});

const gracefulShutdown = (signal: string): void => {
  logger.info({ signal }, 'Shutdown signal received');
  server.close((err) => {
    if (err) {
      logger.error({ err }, 'Error during shutdown');
      process.exit(1);
    }
    logger.info('Server closed cleanly');
    process.exit(0);
  });
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
