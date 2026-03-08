const express = require('express');
const router = express.Router();
const authorize = require('../middleware/authorize');
const { permit } = require('../middleware/permissions');
const pool = require('../db');
const { sendError, sendSuccess } = require('../utils/response');

router.get('/', authorize, async (req, res) => {
  try {
    const user = await pool.query(
      'SELECT full_name, role FROM users WHERE user_id = $1 AND school_id = $2',
      [req.user.user_id, req.user.school_id],
    );

    if (user.rows.length === 0) {
      return sendError(res, { status: 404, message: 'User not found' });
    }

    const profile = {
      full_name: user.rows[0].full_name,
      role: user.rows[0].role,
      welcome_message: `Welcome back, ${user.rows[0].full_name}!`,
    };

    return sendSuccess(res, { data: profile, message: profile.welcome_message });
  } catch (err) {
    console.error(err.message);
    return sendError(res, { status: 500, message: 'Internal Server Error' });
  }
});

router.get('/stats', authorize, permit('Admin'), async (req, res) => {
  try {
    const [students, teachers, subjects, documents] = await Promise.all([
      pool.query(
        'SELECT COUNT(*) FROM students s JOIN users u ON s.user_id = u.user_id WHERE u.school_id = $1',
        [req.user.school_id],
      ),
      pool.query(
        "SELECT COUNT(*) FROM users WHERE role = 'Teacher' AND school_id = $1",
        [req.user.school_id],
      ),
      pool.query('SELECT COUNT(*) FROM subjects WHERE school_id = $1', [req.user.school_id]),
      pool.query('SELECT COUNT(*) FROM school_documents WHERE school_id = $1', [req.user.school_id]),
    ]);

    return sendSuccess(res, {
      data: {
        totalStudents: Number(students.rows[0].count),
        totalTeachers: Number(teachers.rows[0].count),
        totalSubjects: Number(subjects.rows[0].count),
        totalDocuments: Number(documents.rows[0].count),
      },
    });
  } catch (err) {
    console.error(err.message);
    return sendError(res, { status: 500, message: 'Internal Server Error' });
  }
});

module.exports = router;
