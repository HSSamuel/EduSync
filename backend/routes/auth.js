const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const { escapeHtml } = require('../utils/html');
const { z } = require('zod');
const validate = require('../middleware/validate');
const rateLimit = require('express-rate-limit');
const { OAuth2Client } = require('google-auth-library');
const { ACCESS_TOKEN_SECRET } = require('../utils/tokenConfig');
const {
  REFRESH_COOKIE_NAME,
  createSession,
  rotateSession,
  revokeSessionByToken,
  revokeAllUserSessions,
  setRefreshCookie,
  clearRefreshCookie,
} = require('../utils/sessionManager');
const { sendError, sendSuccess } = require('../utils/response');
require('dotenv').config();

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: 'Too many login attempts from this IP, please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 15,
  message: {
    success: false,
    error: 'Registration limit reached from this IP. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: 'Too many password reset requests. Please check your inbox or try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerSchema = z.object({
  full_name: z.string().min(3, 'Name must be at least 3 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['Admin', 'Teacher', 'Student', 'Parent']),
  school_name: z.string().optional(),
  invite_code: z.string().trim().min(1, 'School Invite Code is required').optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

const resetPasswordSchema = z.object({
  token: z.string().trim().min(1, 'Reset token is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

const googleAuthSchema = z
  .object({
    token: z.string().trim().min(1, 'Google token is required'),
    type: z.enum(['login', 'register']),
    role: z.enum(['Admin', 'Teacher', 'Student', 'Parent']).optional(),
    school_name: z.string().trim().min(2).optional(),
    invite_code: z.string().trim().min(1).optional(),
    school_id: z.coerce.number().int().positive().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'register') {
      if (!data.role) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['role'],
          message: 'Role is required for Google registration',
        });
      }

      if (data.role === 'Admin' && !data.school_name) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['school_name'],
          message: 'School name is required for Admin registration',
        });
      }

      if (data.role && data.role !== 'Admin' && !data.invite_code && !data.school_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['invite_code'],
          message: 'Invite code or school ID is required to join an existing school',
        });
      }
    }
  });

async function respondWithSession(res, req, user, message, extraData = {}) {
  const { accessToken, refreshToken, sessionId } = await createSession({ pool, user, req });
  setRefreshCookie(res, refreshToken);

  return sendSuccess(res, {
    message,
    data: {
      token: accessToken,
      user,
      session_id: sessionId,
      ...extraData,
    },
  });
}

router.post('/register', registerLimiter, validate(registerSchema), async (req, res, next) => {
  const client = await pool.connect();

  try {
    const { full_name, email, password, role, school_name, invite_code } = req.body;

    await client.query('BEGIN');

    const userExists = await client.query('SELECT 1 FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      await client.query('ROLLBACK');
      return sendError(res, { status: 409, message: 'User already exists' });
    }

    let finalSchoolId;

    if (role === 'Admin') {
      if (!school_name) {
        await client.query('ROLLBACK');
        return sendError(res, {
          status: 400,
          message: 'School name is required to register an Admin account.',
        });
      }

      const newInviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();
      const newSchool = await client.query(
        `
          INSERT INTO schools (school_name, contact_email, invite_code)
          VALUES ($1, $2, $3)
          RETURNING school_id
        `,
        [school_name, email, newInviteCode],
      );
      finalSchoolId = newSchool.rows[0].school_id;
    } else {
      if (!invite_code) {
        await client.query('ROLLBACK');
        return sendError(res, {
          status: 400,
          message: 'School Invite Code is required to join an existing school.',
        });
      }

      const schoolExists = await client.query('SELECT school_id FROM schools WHERE invite_code = $1', [
        invite_code,
      ]);
      if (schoolExists.rows.length === 0) {
        await client.query('ROLLBACK');
        return sendError(res, { status: 404, message: 'Invalid Invite Code provided.' });
      }

      finalSchoolId = schoolExists.rows[0].school_id;
    }

    const salt = await bcrypt.genSalt(10);
    const bcryptPassword = await bcrypt.hash(password, salt);

    const newUser = await client.query(
      `
        INSERT INTO users (full_name, email, password_hash, role, school_id, auth_provider)
        VALUES ($1, $2, $3, $4, $5, 'local')
        RETURNING user_id, full_name, email, role, school_id
      `,
      [full_name, email, bcryptPassword, role, finalSchoolId],
    );

    await client.query('COMMIT');

    return respondWithSession(res, req, newUser.rows[0], 'Registration successful!');
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

router.post('/login', authLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (user.rows.length === 0) {
      return sendError(res, { status: 401, message: 'Invalid Credentials' });
    }

    if (user.rows[0].auth_provider === 'google') {
      return sendError(res, {
        status: 400,
        message: 'This account was created via Google. Please log in using the Google button.',
      });
    }

    const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);
    if (!validPassword) {
      return sendError(res, { status: 401, message: 'Invalid Credentials' });
    }

    return respondWithSession(
      res,
      req,
      {
        user_id: user.rows[0].user_id,
        full_name: user.rows[0].full_name,
        email: user.rows[0].email,
        role: user.rows[0].role,
        school_id: user.rows[0].school_id,
      },
      'Login successful!',
    );
  } catch (err) {
    next(err);
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies[REFRESH_COOKIE_NAME];
    if (!refreshToken) {
      return sendError(res, { status: 401, message: 'Session expired. Please log in again.' });
    }

    const { accessToken, refreshToken: rotatedRefreshToken, user } = await rotateSession({
      pool,
      refreshToken,
      req,
    });

    setRefreshCookie(res, rotatedRefreshToken);

    return sendSuccess(res, {
      message: 'Session refreshed successfully.',
      data: { token: accessToken, user },
    });
  } catch (err) {
    clearRefreshCookie(res);
    return sendError(res, { status: err.status || 401, message: err.message || 'Invalid refresh token.' });
  }
});

router.post('/logout', async (req, res) => {
  await revokeSessionByToken({ pool, refreshToken: req.cookies[REFRESH_COOKIE_NAME] });
  clearRefreshCookie(res);
  return sendSuccess(res, { message: 'Logged out successfully' });
});

router.post('/forgot-password', forgotPasswordLimiter, validate(forgotPasswordSchema), async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    let emailDeliveryFailed = false;
    let emailDeliveryError = null;

    if (user.rows.length > 0) {
      const secretHashSlice = user.rows[0].password_hash.substring(0, 10);
      const resetToken = jwt.sign(
        { user_id: user.rows[0].user_id, secret: secretHashSlice },
        ACCESS_TOKEN_SECRET,
        { expiresIn: '15m' },
      );

      const resetLink = `${CLIENT_URL}/reset-password/${resetToken}`;
      const safeName = escapeHtml(user.rows[0].full_name);
      const safeLink = escapeHtml(resetLink);
      const emailHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
          <div style="background-color: #2563EB; padding: 20px; text-align: center;">
            <h2 style="color: white; margin: 0;">Password Reset Request</h2>
          </div>
          <div style="padding: 30px; background-color: #f9fafb;">
            <h3 style="color: #333;">Hello ${safeName},</h3>
            <p>We received a request to reset your EduSync password.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${safeLink}" style="background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
            </div>
            <p style="color: #666; font-size: 14px;">This link will expire in 15 minutes. If you did not request this, please ignore this email.</p>
          </div>
        </div>
      `;

      try {
        await sendEmail({
          to: email,
          subject: 'EduSync Password Reset',
          html: emailHTML,
        });
      } catch (emailErr) {
        emailDeliveryFailed = true;
        emailDeliveryError = emailErr;
        console.error('Password reset email failed:', emailErr?.message || emailErr);
      }
    }

    if (user.rows.length > 0 && emailDeliveryFailed && process.env.NODE_ENV !== 'production') {
      return sendError(res, {
        status: 500,
        message: 'Password reset email could not be sent. Check EMAIL_* settings and SMTP connectivity.',
        details: {
          email,
          smtpError: emailDeliveryError?.message || 'Unknown SMTP error',
        },
      });
    }

    return sendSuccess(res, {
      message: 'If that email exists, a reset link has been sent.',
      ...(process.env.NODE_ENV !== 'production'
        ? {
            meta: {
              emailAttempted: user.rows.length > 0,
              emailDelivered: user.rows.length > 0 ? !emailDeliveryFailed : null,
              smtpError: emailDeliveryFailed ? (emailDeliveryError?.message || 'Unknown SMTP error') : null,
            },
          }
        : {}),
    });
  } catch (err) {
    next(err);
  }
});

router.put('/reset-password', validate(resetPasswordSchema), async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const payload = jwt.verify(token, ACCESS_TOKEN_SECRET);

    const user = await pool.query('SELECT password_hash FROM users WHERE user_id = $1', [payload.user_id]);
    if (user.rows.length === 0) {
      return sendError(res, { status: 404, message: 'User not found.' });
    }

    const currentHashSlice = user.rows[0].password_hash.substring(0, 10);
    if (payload.secret !== currentHashSlice) {
      return sendError(res, {
        status: 401,
        message: 'This reset link has already been used or is invalid.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const bcryptPassword = await bcrypt.hash(newPassword, salt);

    await pool.query('UPDATE users SET password_hash = $1 WHERE user_id = $2', [
      bcryptPassword,
      payload.user_id,
    ]);
    await revokeAllUserSessions({ pool, userId: payload.user_id });

    return sendSuccess(res, {
      message: 'Password successfully reset! You can now log in.',
    });
  } catch (err) {
    return sendError(res, {
      status: 401,
      message: 'This reset link is invalid or has expired.',
    });
  }
});

router.post('/google', validate(googleAuthSchema), async (req, res, next) => {
  const client = await pool.connect();

  try {
    const { token, type, role, school_name, invite_code, school_id } = req.body;

    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload.email;
    const full_name = payload.name;

    await client.query('BEGIN');

    const userExists = await client.query('SELECT * FROM users WHERE email = $1', [email]);

    let user_id;
    let final_role;
    let final_school_id;

    if (type === 'login') {
      if (userExists.rows.length === 0) {
        await client.query('ROLLBACK');
        return sendError(res, { status: 404, message: 'Account not found. Please register first.' });
      }
      user_id = userExists.rows[0].user_id;
      final_role = userExists.rows[0].role;
      final_school_id = userExists.rows[0].school_id;
    } else if (type === 'register') {
      if (userExists.rows.length > 0) {
        await client.query('ROLLBACK');
        return sendError(res, { status: 409, message: 'Email is already registered. Please log in.' });
      }

      if (role === 'Admin') {
        const newInviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();
        const newSchool = await client.query(
          `
            INSERT INTO schools (school_name, contact_email, invite_code)
            VALUES ($1, $2, $3)
            RETURNING school_id
          `,
          [school_name, email, newInviteCode],
        );
        final_school_id = newSchool.rows[0].school_id;
      } else if (invite_code) {
        const schoolLookup = await client.query('SELECT school_id FROM schools WHERE invite_code = $1', [
          invite_code,
        ]);

        if (schoolLookup.rows.length === 0) {
          await client.query('ROLLBACK');
          return sendError(res, { status: 404, message: 'Invalid invite code.' });
        }

        final_school_id = schoolLookup.rows[0].school_id;
      } else {
        final_school_id = school_id;
      }

      final_role = role;

      const newUser = await client.query(
        `
          INSERT INTO users (full_name, email, password_hash, role, school_id, auth_provider)
          VALUES ($1, $2, $3, $4, $5, 'google')
          RETURNING user_id
        `,
        [full_name, email, crypto.randomBytes(32).toString('hex'), final_role, final_school_id],
      );
      user_id = newUser.rows[0].user_id;
    } else {
      await client.query('ROLLBACK');
      return sendError(res, { status: 400, message: 'Invalid authentication type.' });
    }

    await client.query('COMMIT');

    return respondWithSession(
      res,
      req,
      { user_id, full_name, email, role: final_role, school_id: final_school_id },
      'Google authentication successful!',
    );
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

module.exports = router;
