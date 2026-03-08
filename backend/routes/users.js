const express = require('express');
const router = express.Router();
const pool = require('../db');
const authorize = require('../middleware/authorize');
const { permit } = require('../middleware/permissions');
const { sendError, sendSuccess } = require('../utils/response');

router.get('/teachers', authorize, permit('Admin'), async (req, res) => {
  try {
    const teachers = await pool.query(
      `
        SELECT user_id, full_name, email
        FROM users
        WHERE role = 'Teacher' AND school_id = $1
        ORDER BY full_name ASC
      `,
      [req.user.school_id],
    );

    return sendSuccess(res, { data: teachers.rows });
  } catch (err) {
    console.error(err.message);
    return sendError(res, { status: 500, message: 'Internal Server Error' });
  }
});

router.get('/parents', authorize, permit('Admin'), async (req, res) => {
  try {
    const parents = await pool.query(
      `
        SELECT user_id, full_name, email
        FROM users
        WHERE role = 'Parent' AND school_id = $1
        ORDER BY full_name ASC
      `,
      [req.user.school_id],
    );

    return sendSuccess(res, { data: parents.rows });
  } catch (err) {
    console.error(err.message);
    return sendError(res, { status: 500, message: 'Internal Server Error' });
  }
});

module.exports = router;
