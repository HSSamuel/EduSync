const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { startTestServer } = require('./helpers/http');
const { freshRequireWithMocks } = require('./helpers/module');
const { sendError } = require('../utils/response');

function makeApp(route) {
  const app = express();
  app.use(express.json());
  app.use('/results', route);
  app.use((err, req, res, next) => sendError(res, { status: err.status || 500, message: err.message || 'Internal Server Error' }));
  return app;
}

test('teacher cannot update grades for a subject not assigned to them', async () => {
  const poolMock = {
    connect: async () => ({
      query: async (sql) => {
        if (sql.includes('FROM results r')) {
          return {
            rows: [{
              result_id: 41,
              subject_id: 9,
              school_id: 10,
              student_id: 5,
              academic_term: 'First Term',
              test_score: 10,
              exam_score: 40,
              total_score: 50,
              subject_name: 'Chemistry',
            }],
          };
        }

        throw new Error('Unexpected query');
      },
      release() {},
    }),
    query: async (sql) => {
      if (sql.includes('FROM subjects')) {
        return { rows: [] };
      }

      throw new Error(`Unexpected pool query: ${sql}`);
    },
  };

  const authMock = (req, res, next) => {
    req.user = { role: 'Teacher', school_id: 10, user_id: 77 };
    next();
  };

  const modulePath = require.resolve('../routes/results');
  const loaded = freshRequireWithMocks(modulePath, {
    '../db': poolMock,
    '../middleware/authorize': authMock,
    '../utils/emailQueue': { emailQueue: { addBulk: async () => {} } },
    '../utils/auditLogger': { logAudit: async () => {} },
  });

  const server = await startTestServer(makeApp(loaded.module));
  try {
    const response = await fetch(`${server.baseUrl}/results/41`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test_score: 15, exam_score: 50 }),
    });
    const payload = await response.json();

    assert.equal(response.status, 403);
    assert.equal(payload.success, false);
    assert.equal(payload.error, 'You can only update grades for your assigned subjects.');
    assert.equal(payload.code, 'FORBIDDEN');
  } finally {
    loaded.restore();
    await server.close();
  }
});
