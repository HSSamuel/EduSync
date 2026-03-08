const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const { z } = require("zod");
const validate = require("../middleware/validate");
const rateLimit = require("express-rate-limit");
const { OAuth2Client } = require("google-auth-library");
require("dotenv").config();

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    error:
      "Too many login attempts from this IP, please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 15,
  message: {
    error: "Registration limit reached from this IP. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const issueSessionTokens = ({ user_id, role, school_id }) => {
  const accessToken = jwt.sign(
    { user_id, role, school_id },
    process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET,
    { expiresIn: "15m" },
  );

  const refreshToken = jwt.sign(
    { user_id, school_id },
    process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );

  return { accessToken, refreshToken };
};

const setRefreshCookie = (res, refreshToken) => {
  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error:
      "Too many password reset requests. Please check your inbox or try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerSchema = z.object({
  full_name: z.string().min(3, "Name must be at least 3 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["Admin", "Teacher", "Student", "Parent"]),
  school_name: z.string().optional(),
  school_id: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

router.post(
  "/register",
  registerLimiter,
  validate(registerSchema),
  async (req, res, next) => {
    const client = await pool.connect();

    try {
      const {
        full_name,
        email,
        password,
        role,
        school_name,
        school_id: invite_code,
      } = req.body;

      await client.query("BEGIN");

      const userExists = await client.query(
        "SELECT 1 FROM users WHERE email = $1",
        [email],
      );
      if (userExists.rows.length > 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "User already exists" });
      }

      let finalSchoolId;

      if (role === "Admin") {
        if (!school_name) {
          await client.query("ROLLBACK");
          return res.status(400).json({
            error: "School name is required to register an Admin account.",
          });
        }

        const newInviteCode = crypto
          .randomBytes(4)
          .toString("hex")
          .toUpperCase();

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
          await client.query("ROLLBACK");
          return res.status(400).json({
            error: "School Invite Code is required to join an existing school.",
          });
        }

        const schoolExists = await client.query(
          "SELECT school_id FROM schools WHERE invite_code = $1",
          [invite_code],
        );
        if (schoolExists.rows.length === 0) {
          await client.query("ROLLBACK");
          return res
            .status(404)
            .json({ error: "Invalid Invite Code provided." });
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

      await client.query("COMMIT");

      const userPayload = newUser.rows[0];
      const { accessToken, refreshToken } = issueSessionTokens(userPayload);
      setRefreshCookie(res, refreshToken);

      res.json({
        token: accessToken,
        user: userPayload,
        message: "Registration successful!",
      });
    } catch (err) {
      await client.query("ROLLBACK");
      next(err);
    } finally {
      client.release();
    }
  },
);

router.post(
  "/login",
  authLimiter,
  validate(loginSchema),
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const user = await pool.query("SELECT * FROM users WHERE email = $1", [
        email,
      ]);

      if (user.rows.length === 0)
        return res.status(401).json({ error: "Invalid Credentials" });

      if (user.rows[0].auth_provider === "google") {
        return res.status(400).json({
          error:
            "This account was created via Google. Please log in using the Google button.",
        });
      }

      const validPassword = await bcrypt.compare(
        password,
        user.rows[0].password_hash,
      );
      if (!validPassword)
        return res.status(401).json({ error: "Invalid Credentials" });

      const { accessToken, refreshToken } = issueSessionTokens({
        user_id: user.rows[0].user_id,
        role: user.rows[0].role,
        school_id: user.rows[0].school_id,
      });

      setRefreshCookie(res, refreshToken);

      res.json({ token: accessToken, message: "Login successful!" });
    } catch (err) {
      next(err);
    }
  },
);

router.post("/refresh", async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refresh_token;
    if (!refreshToken)
      return res
        .status(401)
        .json({ error: "Session expired. Please log in again." });

    const payload = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET,
    );

    const user = await pool.query(
      "SELECT role, school_id FROM users WHERE user_id = $1",
      [payload.user_id],
    );
    if (user.rows.length === 0)
      return res.status(401).json({ error: "User no longer exists." });

    const newAccessToken = jwt.sign(
      {
        user_id: payload.user_id,
        role: user.rows[0].role,
        school_id: user.rows[0].school_id,
      },
      process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET,
      { expiresIn: "15m" },
    );

    res.json({ token: newAccessToken });
  } catch (err) {
    res.status(401).json({ error: "Invalid refresh token." });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("refresh_token");
  res.json({ message: "Logged out successfully" });
});

router.post(
  "/forgot-password",
  forgotPasswordLimiter,
  async (req, res, next) => {
    try {
      const { email } = req.body;
      const user = await pool.query("SELECT * FROM users WHERE email = $1", [
        email,
      ]);

      if (user.rows.length === 0) {
        return res
          .status(404)
          .json({ error: "If that email exists, a reset link has been sent." });
      }

      const secretHashSlice = user.rows[0].password_hash.substring(0, 10);
      const resetToken = jwt.sign(
        { user_id: user.rows[0].user_id, secret: secretHashSlice },
        process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET,
        { expiresIn: "15m" },
      );

      const resetLink = `${CLIENT_URL}/reset-password/${resetToken}`;
      const emailHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
        <div style="background-color: #2563EB; padding: 20px; text-align: center;">
          <h2 style="color: white; margin: 0;">Password Reset Request</h2>
        </div>
        <div style="padding: 30px; background-color: #f9fafb;">
          <h3 style="color: #333;">Hello ${user.rows[0].full_name},</h3>
          <p>We received a request to reset your EduSync password.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
          </div>
          <p style="color: #666; font-size: 14px;">This link will expire in 15 minutes. If you did not request this, please ignore this email.</p>
        </div>
      </div>
    `;

      await sendEmail({
        to: email,
        subject: "EduSync Password Reset",
        html: emailHTML,
      });

      res.json({ message: "Password reset link sent to your email!" });
    } catch (err) {
      next(err);
    }
  },
);

router.put("/reset-password", async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    const payload = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET,
    );

    const user = await pool.query(
      "SELECT password_hash FROM users WHERE user_id = $1",
      [payload.user_id],
    );
    if (user.rows.length === 0)
      return res.status(404).json({ error: "User not found." });

    const currentHashSlice = user.rows[0].password_hash.substring(0, 10);
    if (payload.secret !== currentHashSlice) {
      return res.status(401).json({
        error: "This reset link has already been used or is invalid.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const bcryptPassword = await bcrypt.hash(newPassword, salt);

    await pool.query("UPDATE users SET password_hash = $1 WHERE user_id = $2", [
      bcryptPassword,
      payload.user_id,
    ]);
    res.json({
      message: "✅ Password successfully reset! You can now log in.",
    });
  } catch (err) {
    res
      .status(401)
      .json({ error: "This reset link is invalid or has expired." });
  }
});

router.post("/google", async (req, res, next) => {
  const client = await pool.connect();

  try {
    const { token, type, role, school_name, school_id } = req.body;

    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload.email;
    const full_name = payload.name;

    await client.query("BEGIN");

    const userExists = await client.query(
      "SELECT * FROM users WHERE email = $1",
      [email],
    );

    let user_id;
    let final_role;
    let final_school_id;

    if (type === "login") {
      if (userExists.rows.length === 0) {
        await client.query("ROLLBACK");
        return res
          .status(404)
          .json({ error: "Account not found. Please register first." });
      }
      user_id = userExists.rows[0].user_id;
      final_role = userExists.rows[0].role;
      final_school_id = userExists.rows[0].school_id;
    } else if (type === "register") {
      if (userExists.rows.length > 0) {
        await client.query("ROLLBACK");
        return res
          .status(400)
          .json({ error: "Email is already registered. Please log in." });
      }

      final_school_id = school_id;
      if (role === "Admin") {
        if (!school_name) {
          await client.query("ROLLBACK");
          return res.status(400).json({ error: "School name is required." });
        }
        const newInviteCode = crypto
          .randomBytes(4)
          .toString("hex")
          .toUpperCase();
        const newSchool = await client.query(
          `
            INSERT INTO schools (school_name, contact_email, invite_code)
            VALUES ($1, $2, $3)
            RETURNING school_id
          `,
          [school_name, email, newInviteCode],
        );
        final_school_id = newSchool.rows[0].school_id;
      } else {
        if (!final_school_id) {
          await client.query("ROLLBACK");
          return res
            .status(400)
            .json({ error: "School Invite Code is required." });
        }
        const schoolExists = await client.query(
          "SELECT school_id FROM schools WHERE invite_code = $1",
          [final_school_id],
        );
        if (schoolExists.rows.length === 0) {
          await client.query("ROLLBACK");
          return res
            .status(404)
            .json({ error: "Invalid Invite Code provided." });
        }
        final_school_id = schoolExists.rows[0].school_id;
      }

      final_role = role;
      const salt = await bcrypt.genSalt(10);
      const randomPassword = await bcrypt.hash(
        Math.random().toString(36).slice(-10),
        salt,
      );

      const newUser = await client.query(
        `
          INSERT INTO users (full_name, email, password_hash, role, school_id, auth_provider)
          VALUES ($1, $2, $3, $4, $5, 'google')
          RETURNING user_id
        `,
        [full_name, email, randomPassword, final_role, final_school_id],
      );
      user_id = newUser.rows[0].user_id;
    } else {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Invalid Google auth type." });
    }

    await client.query("COMMIT");

    const { accessToken, refreshToken } = issueSessionTokens({
      user_id,
      role: final_role,
      school_id: final_school_id,
    });

    setRefreshCookie(res, refreshToken);

    res.json({
      token: accessToken,
      message: `${type === "login" ? "Login" : "Registration"} successful!`,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Google Auth Error:", err);
    res.status(401).json({ error: "Google Authentication failed." });
  } finally {
    client.release();
  }
});

module.exports = router;
