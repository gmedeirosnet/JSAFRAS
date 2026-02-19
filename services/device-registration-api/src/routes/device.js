import { insertDeviceRegistration } from '../db/postgres.js';

// Valid device types
const VALID_DEVICE_TYPES = ['iOS', 'Android', 'Watch', 'TV'];

// Input validation
function validateInput(body) {
  const errors = [];

  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Request body must be a JSON object'] };
  }

  // Validate userKey
  if (!body.userKey || typeof body.userKey !== 'string' || body.userKey.trim() === '') {
    errors.push('userKey is required and must be a non-empty string');
  }

  // Validate deviceType
  if (!body.deviceType || typeof body.deviceType !== 'string') {
    errors.push('deviceType is required and must be a string');
  } else if (!VALID_DEVICE_TYPES.includes(body.deviceType)) {
    errors.push(`deviceType must be one of: ${VALID_DEVICE_TYPES.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

async function deviceRoutes(fastify, options) {
  // POST /Device/register
  fastify.post('/Device/register', {
    schema: {
      body: {
        type: 'object',
        required: ['userKey', 'deviceType'],
        properties: {
          userKey: { type: 'string' },
          deviceType: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            statusCode: { type: 'integer' },
          },
        },
        400: {
          type: 'object',
          properties: {
            statusCode: { type: 'integer' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { body } = request;

    // Validate input
    const validation = validateInput(body);
    if (!validation.valid) {
      fastify.log.warn({ errors: validation.errors }, 'Validation failed');
      return reply.status(400).send({ statusCode: 400 });
    }

    const { userKey, deviceType } = body;

    try {
      // Insert into PostgreSQL
      const dbResult = await insertDeviceRegistration(userKey.trim(), deviceType);
      fastify.log.info({ id: dbResult.id, deviceType }, 'Device registered in PostgreSQL');

      return reply.status(200).send({ statusCode: 200 });
    } catch (err) {
      fastify.log.error(err, 'Failed to register device');
      return reply.status(400).send({ statusCode: 400 });
    }
  });
}

export default deviceRoutes;
