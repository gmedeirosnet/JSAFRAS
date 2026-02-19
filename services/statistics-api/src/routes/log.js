import { getDeviceTypeCount, getAllDeviceTypeCounts } from '../db/postgres.js';
import { registerDevice } from '../services/deviceClient.js';

const VALID_DEVICE_TYPES = ['iOS', 'Android', 'Watch', 'TV'];

function validateAuthInput(body) {
  const errors = [];

  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Request body must be a JSON object'] };
  }

  if (!body.userKey || typeof body.userKey !== 'string' || body.userKey.trim() === '') {
    errors.push('userKey is required and must be a non-empty string');
  }

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

function validateStatisticsInput(deviceType) {
  if (!deviceType || typeof deviceType !== 'string') {
    return { valid: false, error: 'deviceType query parameter is required' };
  }

  if (!VALID_DEVICE_TYPES.includes(deviceType)) {
    return { valid: false, error: `deviceType must be one of: ${VALID_DEVICE_TYPES.join(', ')}` };
  }

  return { valid: true };
}

async function logRoutes(fastify, options) {
  fastify.post('/Log/auth', {
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
            message: { type: 'string' },
          },
        },
        400: {
          type: 'object',
          properties: {
            statusCode: { type: 'integer' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { body } = request;

    const validation = validateAuthInput(body);
    if (!validation.valid) {
      fastify.log.warn({ errors: validation.errors }, 'Validation failed');
      return reply.status(400).send({
        statusCode: 400,
        message: 'bad_request'
      });
    }

    const { userKey, deviceType } = body;

    try {
      const result = await registerDevice(userKey.trim(), deviceType);

      if (result.success) {
        fastify.log.info({ userKey: userKey.trim(), deviceType }, 'Auth logged successfully');
        return reply.status(200).send({
          statusCode: 200,
          message: 'success'
        });
      } else {
        fastify.log.warn({ userKey: userKey.trim(), deviceType, result }, 'DeviceRegistration failed');
        return reply.status(400).send({
          statusCode: 400,
          message: 'bad_request'
        });
      }
    } catch (err) {
      fastify.log.error(err, 'Error processing auth log');
      return reply.status(400).send({
        statusCode: 400,
        message: 'bad_request'
      });
    }
  });

  fastify.get('/Log/auth/statistics', {
    schema: {
      querystring: {
        type: 'object',
        required: ['deviceType'],
        properties: {
          deviceType: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            deviceType: { type: 'string' },
            count: { type: 'integer' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { deviceType } = request.query;

    const validation = validateStatisticsInput(deviceType);
    if (!validation.valid) {
      fastify.log.warn({ deviceType, error: validation.error }, 'Statistics validation failed');
      return reply.status(200).send({
        deviceType: deviceType || '',
        count: -1
      });
    }

    try {
      const count = await getDeviceTypeCount(deviceType);

      fastify.log.info({ deviceType, count }, 'Statistics retrieved');
      return reply.status(200).send({
        deviceType,
        count
      });
    } catch (err) {
      fastify.log.error(err, 'Error retrieving statistics');
      return reply.status(200).send({
        deviceType,
        count: -1
      });
    }
  });

  fastify.get('/Log/auth/statistics/all', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            statistics: {
              type: 'object',
              properties: {
                iOS: { type: 'integer' },
                Android: { type: 'integer' },
                Watch: { type: 'integer' },
                TV: { type: 'integer' },
              },
            },
            total: { type: 'integer' },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const result = await getAllDeviceTypeCounts();

      fastify.log.info({ total: result.total }, 'All statistics retrieved');
      return reply.status(200).send(result);
    } catch (err) {
      fastify.log.error(err, 'Error retrieving all statistics');
      return reply.status(200).send({
        statistics: null,
        total: -1
      });
    }
  });
}

export default logRoutes;
