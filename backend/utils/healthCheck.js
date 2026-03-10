const pool = require('../db');
const { connection: redisConnection } = require('./emailQueue');
const { verifyEmailTransport } = require('./sendEmail');

async function checkDatabase() {
  try {
    await pool.query('SELECT 1');
    return { status: 'up' };
  } catch (error) {
    return { status: 'down', error: error.message };
  }
}

async function checkRedis() {
  if (!redisConnection) {
    return { status: 'disabled' };
  }

  try {
    const result = await redisConnection.ping();
    return { status: result === 'PONG' ? 'up' : 'degraded' };
  } catch (error) {
    return { status: 'down', error: error.message };
  }
}

async function checkEmail() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || (!process.env.EMAIL_HOST && !process.env.EMAIL_SERVICE)) {
    return { status: 'disabled' };
  }

  try {
    await verifyEmailTransport();
    return { status: 'up' };
  } catch (error) {
    return { status: 'down', error: error.message };
  }
}

async function getServiceHealthSummary() {
  const [database, redis, email] = await Promise.all([
    checkDatabase(),
    checkRedis(),
    checkEmail(),
  ]);

  const services = { database, redis, email };
  const criticalFailures = ['database'].some((name) => services[name].status === 'down');
  const degraded = Object.values(services).some((service) => service.status === 'down');

  return {
    status: criticalFailures ? 'fail' : degraded ? 'degraded' : 'ok',
    services,
  };
}

module.exports = {
  getServiceHealthSummary,
};
