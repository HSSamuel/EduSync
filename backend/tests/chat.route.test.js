const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { startTestServer } = require('./helpers/http');
const { freshRequireWithMocks } = require('./helpers/module');
const { sendError } = require('../utils/response');

function makeApp(route) {
  const app = express();
  app.use(express.json());
  app.use('/chat', route);
  app.use((err, req, res, next) => sendError(res, { status: err.status || 500, message: err.message || 'Internal Server Error' }));
  return app;
}

test('chat history returns standardized success payload', async () => {
  const poolMock = {
    query: async () => ({
      rows: [
        {
          id: 1,
          room: 'staff',
          message: 'Hello team',
          sender: 'Admin User',
          role: 'Admin',
          time: '2026-03-09T08:30:00.000Z',
        },
      ],
    }),
  };

  const authMock = (req, res, next) => {
    req.user = { school_id: 12, role: 'Admin' };
    next();
  };

  const modulePath = require.resolve('../routes/chat');
  const loaded = freshRequireWithMocks(modulePath, {
    '../db': poolMock,
    '../middleware/authorize': authMock,
  });

  const server = await startTestServer(makeApp(loaded.module));
  try {
    const response = await fetch(`${server.baseUrl}/chat/history/staff`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.ok(Array.isArray(payload.data));
    assert.equal(payload.data[0].room, 'staff');
  } finally {
    loaded.restore();
    await server.close();
  }
});

test('chat history rejects requests without school context using standard error payload', async () => {
  const poolMock = { query: async () => ({ rows: [] }) };
  const authMock = (req, res, next) => {
    req.user = { role: 'Admin' };
    next();
  };

  const modulePath = require.resolve('../routes/chat');
  const loaded = freshRequireWithMocks(modulePath, {
    '../db': poolMock,
    '../middleware/authorize': authMock,
  });

  const server = await startTestServer(makeApp(loaded.module));
  try {
    const response = await fetch(`${server.baseUrl}/chat/history/staff`);
    const payload = await response.json();

    assert.equal(response.status, 403);
    assert.equal(payload.success, false);
    assert.equal(payload.error, 'Access denied. Missing school context.');
    assert.equal(payload.code, 'FORBIDDEN');
  } finally {
    loaded.restore();
    await server.close();
  }
});
