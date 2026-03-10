const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

process.env.NODE_ENV = 'test';
process.env.ACCESS_TOKEN_SECRET = 'test-access-secret';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret';
process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';

const db = require('../db');
const createApp = require('../app');
const { startTestServer } = require('./helpers/http');

function createAccessToken(payload) {
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
}

test('test environment mounts production routes for results, school, and finance', async () => {
  const originalQuery = db.query;
  const token = createAccessToken({ user_id: 1, role: 'Admin', school_id: 22 });

  db.query = async (text) => {
    if (text.includes('FROM school_documents')) {
      return { rows: [] };
    }
    if (text.includes('FROM invoices i')) {
      return { rows: [] };
    }
    if (text.includes('FROM students s')) {
      return { rows: [{ student_id: 999, user_id: 88, parent_id: null, student_name: 'Demo', student_email: null, school_id: 22, parent_name: null, parent_email: null }] };
    }
    if (text.includes('FROM results r')) {
      return { rows: [] };
    }
    if (text.includes('SELECT 1')) {
      return { rows: [{ '?column?': 1 }] };
    }
    throw new Error(`Unexpected query: ${text}`);
  };

  const app = createApp();
  const server = await startTestServer(app);

  try {
    const [resultsRes, schoolRes, financeRes] = await Promise.all([
      fetch(`${server.baseUrl}/api/results/student/999`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${server.baseUrl}/api/school/documents`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${server.baseUrl}/api/finance/invoices`, { headers: { Authorization: `Bearer ${token}` } }),
    ]);

    assert.equal(resultsRes.status, 200);
    assert.equal(schoolRes.status, 200);
    assert.equal(financeRes.status, 200);
  } finally {
    db.query = originalQuery;
    await server.close();
  }
});
