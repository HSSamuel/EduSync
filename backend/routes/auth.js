const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");
const { z } = require("zod");
const validate = require("../middleware/validate");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

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

const registerSchema = z.object({
  full_name: z.string().min(3, "Name must be at least 3 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["Admin", "Teacher", "Student", "Parent"]),
  school_name: z.string().optional(),
  school_id: z.coerce.number().positive().optional(),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

router.post("/register", validate(registerSchema), async (req, res) => {
  try {
    const { full_name, email, password, role, school_name, school_id } =
      req.body;

    const userExists = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email],
    );
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: "User already exists" });
    }

    let finalSchoolId = school_id;

    if (role === "Admin") {
      if (!school_name)
        return res
          .status(400)
          .json({
            error: "School name is required to register an Admin account.",
          });

      const newSchool = await pool.query(
        "INSERT INTO schools (school_name, contact_email) VALUES ($1, $2) RETURNING school_id",
        [school_name, email],
      );
      finalSchoolId = newSchool.rows[0].school_id;
    } else {
      if (!finalSchoolId)
        return res
          .status(400)
          .json({ error: "School ID is required to join an existing school." });

      const schoolExists = await pool.query(
        "SELECT school_id FROM schools WHERE school_id = $1",
        [finalSchoolId],
      );
      if (schoolExists.rows.length === 0)
        return res.status(404).json({ error: "Invalid School ID provided." });
    }

    const salt = await bcrypt.genSalt(10);
    const bcryptPassword = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      "INSERT INTO users (full_name, email, password_hash, role, school_id) VALUES ($1, $2, $3, $4, $5) RETURNING user_id, full_name, email, role, school_id",
      [full_name, email, bcryptPassword, role, finalSchoolId],
    );

    res.json(newUser.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

router.post("/login", authLimiter, validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (user.rows.length === 0)
      return res.status(401).json({ error: "Invalid Credentials" });

    const validPassword = await bcrypt.compare(
      password,
      user.rows[0].password_hash,
    );
    if (!validPassword)
      return res.status(401).json({ error: "Invalid Credentials" });

    const accessToken = jwt.sign(
      {
        user_id: user.rows[0].user_id,
        role: user.rows[0].role,
        school_id: user.rows[0].school_id,
      },
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
    );

    const refreshToken = jwt.sign(
      {
        user_id: user.rows[0].user_id,
        school_id: user.rows[0].school_id,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ token: accessToken, message: "Login successful!" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

router.post("/refresh", async (req, res) => {
  try {
    const refreshToken = req.cookies.refresh_token;
    if (!refreshToken)
      return res
        .status(401)
        .json({ error: "Session expired. Please log in again." });

    const payload = jwt.verify(refreshToken, process.env.JWT_SECRET);

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
      process.env.JWT_SECRET,
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

router.post("/forgot-password", async (req, res) => {
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

    const resetToken = jwt.sign(
      { user_id: user.rows[0].user_id },
      process.env.JWT_SECRET,
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

    sendEmail({
      to: email,
      subject: "EduSync Password Reset",
      html: emailHTML,
    });

    res.json({ message: "Password reset link sent to your email!" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

router.put("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
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

module.exports = router;
