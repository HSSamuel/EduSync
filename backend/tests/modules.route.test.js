const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { startTestServer } = require('./helpers/http');
const { freshRequireWithMocks } = require('./helpers/module');
const { sendError } = require('../utils/response');

function makeApp(route) {
  const app = express();
  app.use(express.json());
  app.use('/modules', route);
  app.use((err, req, res, next) => sendError(res, { status: err.status || 500, message: err.message || 'Internal Server Error' }));
  return app;
}

test('modules list returns standardized success payload', async () => {
  const poolMock = {
    query: async () => ({ rows: [{ module_id: 1, title: 'Intro', subject_name: 'Math' }] }),
  };
  const authMock = (req, res, next) => {
    req.user = { role: 'Teacher', school_id: 22, user_id: 7 };
    next();
  };
  const cloudinaryMock = { cloudinary: { uploader: {} } };

  const modulePath = require.resolve('../routes/modules');
  const loaded = freshRequireWithMocks(modulePath, {
    '../db': poolMock,
    '../middleware/authorize': authMock,
    '../utils/cloudinary': cloudinaryMock,
  });

  const server = await startTestServer(makeApp(loaded.module));
  try {
    const response = await fetch(`${server.baseUrl}/modules`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data[0].title, 'Intro');
  } finally {
    loaded.restore();
    await server.close();
  }
});

test('module upload without file returns standardized validation error', async () => {
  const poolMock = { query: async () => ({ rows: [] }) };
  const authMock = (req, res, next) => {
    req.user = { role: 'Teacher', school_id: 22, user_id: 7 };
    next();
  };
  const cloudinaryMock = { cloudinary: { uploader: {} } };

  const modulePath = require.resolve('../routes/modules');
  const loaded = freshRequireWithMocks(modulePath, {
    '../db': poolMock,
    '../middleware/authorize': authMock,
    '../utils/cloudinary': cloudinaryMock,
  });

  const server = await startTestServer(makeApp(loaded.module));
  try {
    const response = await fetch(`${server.baseUrl}/modules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject_id: 1, title: 'Biology Pack' }),
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.error, 'A file upload is required.');
    assert.equal(payload.code, 'FILE_REQUIRED');
  } finally {
    loaded.restore();
    await server.close();
  }
});

test('module upload rejects unsupported file types with shared payload', async () => {
  const poolMock = { query: async () => ({ rows: [] }) };
  const authMock = (req, res, next) => {
    req.user = { role: 'Admin', school_id: 22, user_id: 1 };
    next();
  };
  const cloudinaryMock = { cloudinary: { uploader: {} } };

  const modulePath = require.resolve('../routes/modules');
  const loaded = freshRequireWithMocks(modulePath, {
    '../db': poolMock,
    '../middleware/authorize': authMock,
    '../utils/cloudinary': cloudinaryMock,
  });

  const server = await startTestServer(makeApp(loaded.module));
  try {
    const form = new FormData();
    form.append('subject_id', '1');
    form.append('title', 'Bad Upload');
    form.append('file', new Blob(['<xml />'], { type: 'application/xml' }), 'bad.xml');

    const response = await fetch(`${server.baseUrl}/modules`, {
      method: 'POST',
      body: form,
    });
    const payload = await response.json();

    assert.equal(response.status, 500);
    assert.equal(payload.success, false);
    assert.match(payload.error, /Unsupported file type/i);
  } finally {
    loaded.restore();
    await server.close();
  }
});
