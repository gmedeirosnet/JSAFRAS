import Fastify from 'fastify';
import deviceRoutes from './routes/device.js';
import { initPostgres, closePostgres } from './db/postgres.js';

const fastify = Fastify({
  logger: true,
  trustProxy: true
});

const PORT = process.env.DEVICE_REGISTRATION_API_PORT || 3001;
const HOST = '0.0.0.0';

// Health check endpoint
fastify.get('/health', async () => {
  return { status: 'ok', service: 'device-registration-api' };
});

// Register routes
fastify.register(deviceRoutes);

// Graceful shutdown
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

// Start server
const start = async () => {
  try {
    // Initialize database connection
    await initPostgres();

    await fastify.listen({ port: PORT, host: HOST });
    fastify.log.info(`Device Registration API listening on ${HOST}:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
