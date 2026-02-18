'use strict';

const DEVICE_REGISTRATION_API_URL = process.env.DEVICE_REGISTRATION_API_URL || 'http://device-registration-api:3001';

async function registerDevice(userKey, deviceType) {
  const url = `${DEVICE_REGISTRATION_API_URL}/Device/register`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userKey, deviceType }),
    });

    const data = await response.json();

    return {
      success: response.ok && data.statusCode === 200,
      statusCode: data.statusCode || response.status,
    };
  } catch (err) {
    console.error('Error calling DeviceRegistrationAPI:', err.message);
    return {
      success: false,
      statusCode: 500,
    };
  }
}

module.exports = {
  registerDevice,
};
