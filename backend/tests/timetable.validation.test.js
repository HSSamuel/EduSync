const test = require('node:test');
const assert = require('node:assert/strict');
const { timetableSchema } = require('../utils/schoolValidation');

test('accepts a valid timetable payload', () => {
  const result = timetableSchema.safeParse({
    class_grade: 'JSS 1',
    schedule: {
      Monday: [
        { start_time: '08:00', end_time: '09:00', subject: 'Mathematics' },
        { start_time: '09:00', end_time: '10:00', subject: 'English' },
      ],
      Tuesday: [],
    },
  });

  assert.equal(result.success, true);
});

test('rejects overlapping timetable slots', () => {
  const result = timetableSchema.safeParse({
    class_grade: 'JSS 1',
    schedule: {
      Monday: [
        { start_time: '08:00', end_time: '09:00', subject: 'Mathematics' },
        { start_time: '08:30', end_time: '09:30', subject: 'English' },
      ],
    },
  });

  assert.equal(result.success, false);
  assert.match(result.error.issues[0].message, /overlaps/i);
});

test('rejects unsupported weekday keys', () => {
  const result = timetableSchema.safeParse({
    class_grade: 'JSS 1',
    schedule: {
      Sunday: [{ start_time: '08:00', end_time: '09:00', subject: 'Revision' }],
    },
  });

  assert.equal(result.success, false);
  assert.match(result.error.issues[0].message, /Only these days are allowed/i);
});
