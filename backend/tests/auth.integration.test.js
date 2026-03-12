const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

process.env.NODE_ENV = 'test';
process.env.ACCESS_TOKEN_SECRET = 'test-access-secret';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret';

const db = require('../db');
const createApp = require('../app');
const { hashToken } = require('../utils/sessionManager');
const { startTestServer } = require('./helpers/http');

function jsonHeaders(extra = {}) {
  return { 'Content-Type': 'application/json', ...extra };
}

test('forgot-password does not enumerate accounts', async () => {
  const originalQuery = db.query;
  db.query = async (text) => {
    if (text.includes('SELECT * FROM users WHERE email = $1')) {
      return { rows: [] };
    }
    throw new Error(`Unexpected query: ${text}`);
  };

  const app = createApp();
  const server = await startTestServer(app);

  try {
    const response = await fetch(`${server.baseUrl}/api/auth/forgot-password`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ email: 'ghost@example.com' }),
    });

    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.message, 'If that email exists, a reset link has been sent.');
  } finally {
    db.query = originalQuery;
    await server.close();
  }
});

test('refresh rotates the session and returns a new access token', async () => {
  const originalQuery = db.query;
  let updateCount = 0;

  const refreshToken = jwt.sign(
    { user_id: 5, school_id: 2, session_id: 10, token_version: 1 },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' },
  );

  db.query = async (text) => {
    if (text.includes('SELECT session_id, user_id, school_id, token_version')) {
      return {
        rows: [{
          session_id: 10,
          user_id: 5,
          school_id: 2,
          token_version: 1,
          revoked_at: null,
          expires_at: new Date(Date.now() + 60_000).toISOString(),
          refresh_token_hash: hashToken(refreshToken),
        }],
      };
    }

    if (text.includes('SELECT user_id, role, school_id FROM users')) {
      return { rows: [{ user_id: 5, role: 'Admin', school_id: 2 }] };
    }

    if (text.includes('UPDATE user_sessions')) {
      updateCount += 1;
      return { rows: [], rowCount: 1 };
    }

    throw new Error(`Unexpected query: ${text}`);
  };

  const app = createApp();
  const server = await startTestServer(app);

  try {
    const response = await fetch(`${server.baseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: { Cookie: `refresh_token=${refreshToken}` },
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(typeof payload.data.token, 'string');
    assert.ok(updateCount >= 1);
    assert.match(response.headers.get('set-cookie') || '', /refresh_token=/);
  } finally {
    db.query = originalQuery;
    await server.close();
  }
});


test('access token in cookie is rejected when Authorization header is missing', async () => {
  const originalQuery = db.query;
  db.query = async (text) => {
    if (text.includes('SELECT 1')) {
      return { rows: [{ '?column?': 1 }] };
    }
    throw new Error(`Unexpected query: ${text}`);
  };

  const token = jwt.sign({ user_id: 5, role: 'Admin', school_id: 2 }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: '15m',
  });

  const app = createApp();
  const server = await startTestServer(app);

  try {
    const response = await fetch(`${server.baseUrl}/api/users/teachers`, {
      headers: { Cookie: `access_token=${token}` },
    });
    const payload = await response.json();

    assert.equal(response.status, 403);
    assert.equal(payload.success, false);
    assert.equal(payload.code, 'NO_ACCESS_TOKEN');
  } finally {
    db.query = originalQuery;
    await server.close();
  }
});


test('google registration rejects non-admin join without invite code', async () => {
  const app = createApp();
  const server = await startTestServer(app);

  try {
    const response = await fetch(`${server.baseUrl}/api/auth/google`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({
        token: 'fake-google-token',
        type: 'register',
        role: 'Teacher',
      }),
    });

    const payload = await response.json();
    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.match(payload.error, /invite code is required/i);
  } finally {
    await server.close();
  }
});
