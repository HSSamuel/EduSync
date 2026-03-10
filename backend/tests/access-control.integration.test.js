const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

process.env.NODE_ENV = 'test';
process.env.ACCESS_TOKEN_SECRET = 'test-access-secret';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret';

const db = require('../db');
const createApp = require('../app');
const { startTestServer } = require('./helpers/http');

function createAccessToken(payload) {
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
}

test('non-admin users cannot access teacher directory', async () => {
  const token = createAccessToken({ user_id: 9, role: 'Student', school_id: 44 });
  const app = createApp();
  const server = await startTestServer(app);

  try {
    const response = await fetch(`${server.baseUrl}/api/users/teachers`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = await response.json();

    assert.equal(response.status, 403);
    assert.equal(payload.success, false);
    assert.equal(payload.error, 'Access Denied.');
  } finally {
    await server.close();
  }
});

test('student listing is scoped to the authenticated student', async () => {
  const originalQuery = db.query;
  const token = createAccessToken({ user_id: 11, role: 'Student', school_id: 99 });

  db.query = async (text, params) => {
    if (text.includes('SELECT COUNT(*)')) {
      assert.deepEqual(params, [99, 11]);
      return { rows: [{ count: '1' }] };
    }

    if (text.includes('SELECT') && text.includes('FROM students s')) {
      assert.deepEqual(params, [99, 11, 10, 0]);
      return {
        rows: [{
          student_id: 7,
          user_id: 11,
          parent_id: null,
          full_name: 'Student Self',
          email: null,
          class_grade: 'JSS 2',
          enrollment_date: '2026-01-10',
        }],
      };
    }

    throw new Error(`Unexpected query: ${text}`);
  };

  const app = createApp();
  const server = await startTestServer(app);

  try {
    const response = await fetch(`${server.baseUrl}/api/students`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.length, 1);
    assert.equal(payload.data[0].full_name, 'Student Self');
    assert.equal(payload.data[0].email, null);
    assert.equal(payload.meta.pagination.total, 1);
  } finally {
    db.query = originalQuery;
    await server.close();
  }
});

test('teacher listing is limited to students in assigned subjects only', async () => {
  const originalQuery = db.query;
  const token = createAccessToken({ user_id: 21, role: 'Teacher', school_id: 5 });

  db.query = async (text, params) => {
    if (text.includes('SELECT subject_id, subject_name FROM subjects')) {
      assert.deepEqual(params, [21, 5]);
      return { rows: [{ subject_id: 301, subject_name: 'Physics' }, { subject_id: 302, subject_name: 'Chemistry' }] };
    }

    if (text.includes('SELECT DISTINCT t.class_grade')) {
      assert.deepEqual(params, [5, ['Physics', 'Chemistry']]);
      return { rows: [{ class_grade: 'SS 1' }] };
    }

    if (text.includes('SELECT COUNT(*)')) {
      assert.deepEqual(params, [5, ['SS 1']]);
      return { rows: [{ count: '2' }] };
    }

    if (text.includes('SELECT') && text.includes('FROM students s')) {
      assert.deepEqual(params, [5, ['SS 1'], 10, 0]);
      return {
        rows: [
          {
            student_id: 1,
            user_id: 101,
            parent_id: null,
            full_name: 'Amina Yusuf',
            email: null,
            class_grade: 'SS 1',
            enrollment_date: '2026-01-11',
          },
          {
            student_id: 2,
            user_id: 102,
            parent_id: null,
            full_name: 'Bala Musa',
            email: null,
            class_grade: 'SS 1',
            enrollment_date: '2026-01-12',
          },
        ],
      };
    }

    throw new Error(`Unexpected query: ${text}`);
  };

  const app = createApp();
  const server = await startTestServer(app);

  try {
    const response = await fetch(`${server.baseUrl}/api/students`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.length, 2);
    assert.equal(payload.data[0].email, null);
    assert.equal(payload.meta.pagination.total, 2);
  } finally {
    db.query = originalQuery;
    await server.close();
  }
});
