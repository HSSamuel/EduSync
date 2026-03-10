const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { startTestServer } = require('./helpers/http');
const { freshRequireWithMocks } = require('./helpers/module');
const { sendError } = require('../utils/response');

function makeApp(route) {
  const app = express();
  app.use(express.json());
  app.use('/finance', route);
  app.use((err, req, res, next) => sendError(res, { status: err.status || 500, message: err.message || 'Internal Server Error' }));
  return app;
}

test('finance checkout returns standardized not-found error when invoice is inaccessible', async () => {
  const poolMock = { query: async () => ({ rows: [] }) };
  const authMock = (req, res, next) => {
    req.user = { role: 'Parent', school_id: 3, user_id: 91 };
    next();
  };

  const stripeFactoryMock = () => ({
    checkout: { sessions: { create: async () => ({ url: 'https://checkout.example/session' }) } },
    webhooks: { constructEvent: () => ({ type: 'noop' }) },
  });

  const modulePath = require.resolve('../routes/finance');
  const loaded = freshRequireWithMocks(modulePath, {
    '../db': poolMock,
    '../middleware/authorize': authMock,
    '../utils/emailQueue': { emailQueue: { add: async () => {} } },
    '../utils/auditLogger': { logAudit: async () => {} },
    'stripe': stripeFactoryMock,
  });

  const server = await startTestServer(makeApp(loaded.module));
  try {
    const response = await fetch(`${server.baseUrl}/finance/invoices/999/checkout`, {
      method: 'POST',
    });
    const payload = await response.json();

    assert.equal(response.status, 404);
    assert.equal(payload.success, false);
    assert.equal(payload.error, 'Invoice not found or not accessible.');
  } finally {
    loaded.restore();
    await server.close();
  }
});
