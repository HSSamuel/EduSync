const test = require('node:test');
const assert = require('node:assert/strict');
const {
  broadcastSchema,
  documentTitleSchema,
  eventSchema,
} = require('../utils/schoolValidation');

test('broadcast schema rejects short messages', () => {
  const result = broadcastSchema.safeParse({
    audience: 'All',
    subject: 'Notice',
    message: 'short',
  });

  assert.equal(result.success, false);
  assert.match(result.error.issues[0].message, /too short/i);
});

test('document title schema accepts a valid title', () => {
  const result = documentTitleSchema.safeParse({ title: 'Midterm Circular' });
  assert.equal(result.success, true);
});

test('event schema requires title and event type', () => {
  const result = eventSchema.safeParse({
    title: ' ',
    event_date: '2026-03-08',
    event_type: ' ',
  });

  assert.equal(result.success, false);
  assert.ok(result.error.issues.length >= 2);
});
