import Fastify from 'fastify';
import logRoutes from './routes/log.js';
import { initPostgres, closePostgres } from './db/postgres.js';

const fastify = Fastify({
  logger: true,
  trustProxy: true
});

const PORT = process.env.STATISTICS_API_PORT || 3000;
const HOST = '0.0.0.0';

fastify.get('/health', async () => {
  return { status: 'ok', service: 'statistics-api' };
});

fastify.register(logRoutes);

const gracefulShutdown = async (signal) => {
  fastify.log.info(`Received ${signal}, shutting down gracefully...`);

  try {
    await fastify.close();
    await closePostgres();
    process.exit(0);
  } catch (err) {
    fastify.log.error(err, 'Error during shutdown');
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

const start = async () => {
  try {
    await initPostgres();

    await fastify.listen({ port: PORT, host: HOST });
    fastify.log.info(`Statistics API listening on ${HOST}:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
