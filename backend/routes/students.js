const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { ACCESS_TOKEN_SECRET } = require('../utils/tokenConfig');
const crypto = require('crypto');
const authorize = require('../middleware/authorize');
const { permit, resolveStudentScope } = require('../middleware/permissions');
const sendEmail = require('../utils/sendEmail');
const { logAudit } = require('../utils/auditLogger');
const { escapeHtml } = require('../utils/html');
const { z } = require('zod');
const validate = require('../middleware/validate');
const { sendError, sendSuccess } = require('../utils/response');

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const createStudentSchema = z.object({
  full_name: z.string().min(2, 'Full name is required'),
  email: z.string().email('A valid email is required'),
  class_grade: z.string().min(1, 'Class/Grade is required'),
});

const linkParentSchema = z.object({
  parent_id: z.coerce.number().int().positive('A valid parent ID is required'),
});

const bulkDeleteStudentsSchema = z.object({
  student_ids: z
    .array(z.coerce.number().int().positive('Each student ID must be valid'))
    .min(1, 'Select at least one student'),
});

function buildStudentSelectFields(role) {
  const emailField = role === 'Admin' ? 'u.email' : 'NULL::varchar AS email';
  const parentField = role === 'Admin' ? 's.parent_id' : 'NULL::int AS parent_id';

  return `
    s.student_id,
    s.user_id,
    ${parentField},
    u.full_name,
    ${emailField},
    s.class_grade,
    s.enrollment_date
  `;
}

router.post('/', authorize, permit('Admin'), validate(createStudentSchema), async (req, res) => {
  const client = await pool.connect();

  try {
    const { full_name, email, class_grade } = req.body;

    const tempPassword = crypto.randomBytes(24).toString('base64url');
    const salt = await bcrypt.genSalt(10);
    const bcryptPassword = await bcrypt.hash(tempPassword, salt);

    await client.query('BEGIN');

    const newUser = await client.query(
      "INSERT INTO users (full_name, email, password_hash, role, school_id) VALUES ($1, $2, $3, 'Student', $4) RETURNING user_id, full_name, email",
      [full_name, email, bcryptPassword, req.user.school_id],
    );

    const newUserId = newUser.rows[0].user_id;

    const newStudent = await client.query(
      'INSERT INTO students (user_id, class_grade) VALUES ($1, $2) RETURNING *',
      [newUserId, class_grade],
    );

    await logAudit({
      client,
      userId: req.user.user_id,
      action: 'CREATE_STUDENT',
      targetTable: 'students',
      recordId: newStudent.rows[0].student_id,
      newValue: {
        ...newStudent.rows[0],
        full_name: newUser.rows[0].full_name,
        email: newUser.rows[0].email,
      },
    });

    await client.query('COMMIT');

    const secretHashSlice = bcryptPassword.substring(0, 10);
    const resetToken = jwt.sign(
      { user_id: newUserId, secret: secretHashSlice },
      ACCESS_TOKEN_SECRET,
      { expiresIn: '15m' },
    );

    const setPasswordLink = `${CLIENT_URL}/reset-password/${resetToken}`;
    const safeName = escapeHtml(full_name);
    const safePortal = escapeHtml(CLIENT_URL);
    const safeEmail = escapeHtml(email);
    const safeSetPasswordLink = escapeHtml(setPasswordLink);

    const emailHTML = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
        <div style="background-color: #2563EB; padding: 20px; text-align: center;">
          <h2 style="color: white; margin: 0;">Welcome to EduSync</h2>
        </div>
        <div style="padding: 30px; background-color: #f9fafb;">
          <h3 style="color: #1e3a8a;">Dear ${safeName},</h3>
          <p>Welcome to your new digital learning and management portal!</p>
          <p>Through your secure dashboard, you will be able to download study materials and view your official report cards.</p>
          <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px dashed #cbd5e1;">
            <p style="margin: 0 0 10px 0;"><strong>Get Started</strong></p>
            <p style="margin: 0;"><strong>Portal Link:</strong> ${safePortal}</p>
            <p style="margin: 0;"><strong>Username:</strong> ${safeEmail}</p>
          </div>
          <p style="margin: 0 0 12px 0;">To secure your account, please set your password using the button below. <strong>This link expires in 15 minutes.</strong></p>
          <div style="text-align: center; margin: 18px 0;">
            <a href="${safeSetPasswordLink}" style="display: inline-block; background-color: #2563EB; color: #fff; padding: 12px 18px; border-radius: 8px; text-decoration: none; font-weight: 600;">Set Your Password</a>
          </div>
          <p style="font-size: 13px; color: #64748b; margin-top: 16px;">If you did not request this, please ignore this email. Your account remains secure.</p>
          <p style="margin-top: 30px;">Warm regards,<br/><strong>The Administration Team</strong></p>
        </div>
      </div>
    `;

    let emailDispatched = true;
    try {
      await sendEmail({
        to: email,
        subject: 'Welcome to EduSync - Set Your Password',
        html: emailHTML,
      });
    } catch (emailErr) {
      emailDispatched = false;
      console.error('Email dispatch failed:', emailErr?.message || emailErr);
    }

    return sendSuccess(res, {
      status: 201,
      message: emailDispatched
        ? 'Student registered successfully! Set-password email dispatched.'
        : 'Student registered successfully, but email dispatch failed. Please resend reset link.',
      data: {
        user_account: newUser.rows[0],
        academic_record: newStudent.rows[0],
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err.message);

    if (err.code === '23505') {
      return sendError(res, {
        status: 409,
        message: 'A user with that email already exists.',
        code: 'DUPLICATE_USER_EMAIL',
      });
    }

    return sendError(res, { status: 500, message: 'Internal Server Error' });
  } finally {
    client.release();
  }
});

router.get('/', authorize, async (req, res) => {
  try {
    const { search = '', class_grade = '', page = 1, limit = 10 } = req.query;
    const parsedPage = Math.max(Number(page) || 1, 1);
    const parsedLimit = Math.min(Math.max(Number(limit) || 10, 1), 1000);
    const offset = (parsedPage - 1) * parsedLimit;

    const scope = await resolveStudentScope({ pool, user: req.user });
    let baseQuery = `
      FROM students s
      JOIN users u ON s.user_id = u.user_id
      WHERE ${scope.clause}
    `;
    const queryParams = [...scope.params];
    let paramIndex = queryParams.length + 1;

    if (search) {
      baseQuery += ` AND u.full_name ILIKE $${paramIndex}`;
      queryParams.push(`%${search}%`);
      paramIndex += 1;
    }

    if (class_grade) {
      baseQuery += ` AND s.class_grade = $${paramIndex}`;
      queryParams.push(class_grade);
      paramIndex += 1;
    }

    const countResult = await pool.query(`SELECT COUNT(*) ${baseQuery}`, queryParams);
    const totalItems = Number(countResult.rows[0].count || 0);

    const dataQuery = `
      SELECT ${buildStudentSelectFields(req.user.role)}
      ${baseQuery}
      ORDER BY u.full_name ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(parsedLimit, offset);

    const students = await pool.query(dataQuery, queryParams);

    return sendSuccess(res, {
      data: students.rows,
      meta: {
        pagination: {
          total: totalItems,
          page: parsedPage,
          limit: parsedLimit,
          totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / parsedLimit),
        },
      },
    });
  } catch (err) {
    console.error(err.message);
    return sendError(res, { status: 500, message: 'Internal Server Error' });
  }
});

router.delete('/bulk-delete', authorize, permit('Admin'), validate(bulkDeleteStudentsSchema), async (req, res) => {
  const client = await pool.connect();

  try {
    const { student_ids } = req.body;

    await client.query('BEGIN');

    const studentsResult = await client.query(
      `
        SELECT
          s.student_id,
          s.user_id,
          s.parent_id,
          s.class_grade,
          u.full_name,
          u.email,
          u.school_id
        FROM students s
        JOIN users u ON s.user_id = u.user_id
        WHERE s.student_id = ANY($1::int[]) AND u.school_id = $2
      `,
      [student_ids, req.user.school_id],
    );

    const foundIds = studentsResult.rows.map((row) => row.student_id);
    const missingIds = student_ids.filter((id) => !foundIds.includes(id));

    if (missingIds.length > 0) {
      await client.query('ROLLBACK');
      return sendError(res, {
        status: 404,
        message: `Some selected students were not found in your school: ${missingIds.join(', ')}`,
      });
    }

    for (const student of studentsResult.rows) {
      await client.query('DELETE FROM students WHERE student_id = $1', [student.student_id]);
      await client.query('DELETE FROM users WHERE user_id = $1', [student.user_id]);

      await logAudit({
        client,
        userId: req.user.user_id,
        action: 'DELETE_STUDENT',
        targetTable: 'students',
        recordId: student.student_id,
        oldValue: {
          student_id: student.student_id,
          user_id: student.user_id,
          parent_id: student.parent_id,
          class_grade: student.class_grade,
          full_name: student.full_name,
          email: student.email,
        },
        newValue: null,
      });
    }

    await client.query('COMMIT');

    return sendSuccess(res, {
      message:
        student_ids.length === 1
          ? 'Student deleted successfully.'
          : `${student_ids.length} students deleted successfully.`,
      data: { deleted_ids: student_ids },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err.message);
    return sendError(res, { status: 500, message: 'Internal Server Error' });
  } finally {
    client.release();
  }
});

router.delete('/:id', authorize, permit('Admin'), async (req, res) => {
  const client = await pool.connect();

  try {
    const student_id = Number(req.params.id);

    if (!Number.isInteger(student_id) || student_id <= 0) {
      return sendError(res, { status: 400, message: 'A valid student ID is required.' });
    }

    await client.query('BEGIN');

    const studentQuery = await client.query(
      `
        SELECT
          s.student_id,
          s.user_id,
          s.parent_id,
          s.class_grade,
          u.full_name,
          u.email,
          u.school_id
        FROM students s
        JOIN users u ON s.user_id = u.user_id
        WHERE s.student_id = $1 AND u.school_id = $2
      `,
      [student_id, req.user.school_id],
    );

    if (studentQuery.rows.length === 0) {
      await client.query('ROLLBACK');
      return sendError(res, { status: 404, message: 'Student not found in your school.' });
    }

    const student = studentQuery.rows[0];

    await client.query('DELETE FROM students WHERE student_id = $1', [student_id]);
    await client.query('DELETE FROM users WHERE user_id = $1', [student.user_id]);

    await logAudit({
      client,
      userId: req.user.user_id,
      action: 'DELETE_STUDENT',
      targetTable: 'students',
      recordId: student.student_id,
      oldValue: {
        student_id: student.student_id,
        user_id: student.user_id,
        parent_id: student.parent_id,
        class_grade: student.class_grade,
        full_name: student.full_name,
        email: student.email,
      },
      newValue: null,
    });

    await client.query('COMMIT');

    return sendSuccess(res, { message: 'Student deleted successfully.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err.message);
    return sendError(res, { status: 500, message: 'Internal Server Error' });
  } finally {
    client.release();
  }
});

router.put('/:id/link-parent', authorize, permit('Admin'), validate(linkParentSchema), async (req, res) => {
  try {
    const student_id = Number(req.params.id);
    const { parent_id } = req.body;

    if (!Number.isInteger(student_id) || student_id <= 0) {
      return sendError(res, { status: 400, message: 'A valid student ID is required.' });
    }

    const studentQuery = await pool.query(
      `
        SELECT s.student_id, s.parent_id, u.school_id
        FROM students s
        JOIN users u ON s.user_id = u.user_id
        WHERE s.student_id = $1 AND u.school_id = $2
      `,
      [student_id, req.user.school_id],
    );

    if (studentQuery.rows.length === 0) {
      return sendError(res, { status: 404, message: 'Student not found in your school.' });
    }

    const parentQuery = await pool.query(
      `
        SELECT user_id, role, school_id
        FROM users
        WHERE user_id = $1 AND school_id = $2
      `,
      [parent_id, req.user.school_id],
    );

    if (parentQuery.rows.length === 0) {
      return sendError(res, { status: 404, message: 'Parent account not found in your school.' });
    }

    if (parentQuery.rows[0].role !== 'Parent') {
      return sendError(res, { status: 400, message: 'The selected user is not a parent account.' });
    }

    await pool.query('UPDATE students SET parent_id = $1 WHERE student_id = $2', [parent_id, student_id]);

    await logAudit({
      userId: req.user.user_id,
      action: 'LINK_PARENT',
      targetTable: 'students',
      recordId: student_id,
      oldValue: { parent_id: studentQuery.rows[0].parent_id },
      newValue: { parent_id },
    });

    return sendSuccess(res, { message: 'Parent successfully linked to student!' });
  } catch (err) {
    console.error(err.message);
    return sendError(res, { status: 500, message: 'Internal Server Error' });
  }
});

router.get('/my-children', authorize, permit('Parent'), async (req, res) => {
  try {
    const children = await pool.query(
      `
        SELECT students.student_id, users.full_name, students.class_grade
        FROM students
        JOIN users ON students.user_id = users.user_id
        WHERE students.parent_id = $1 AND users.school_id = $2
        ORDER BY users.full_name ASC
      `,
      [req.user.user_id, req.user.school_id],
    );

    return sendSuccess(res, { data: children.rows });
  } catch (err) {
    console.error(err.message);
    return sendError(res, { status: 500, message: 'Internal Server Error' });
  }
});

module.exports = router;
