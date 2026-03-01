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

// --- 1. RATE LIMITING SETUP ---
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per window
  message: {
    error:
      "Too many login attempts from this IP, please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// --- 2. ZOD SCHEMAS ---
const registerSchema = z.object({
  full_name: z.string().min(3, "Name must be at least 3 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["Admin", "Teacher", "Student", "Parent"]),
  // 👈 NEW: Accept school_id, but default to 1 if the frontend doesn't provide it yet
  school_id: z.coerce.number().positive().optional().default(1),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

// --- 3. ROUTES ---

// REGISTER (Validated)
router.post("/register", validate(registerSchema), async (req, res) => {
  try {
    // 👈 NEW: Extract school_id from the validated body
    const { full_name, email, password, role, school_id } = req.body;

    // Check if user already exists first!
    const userExists = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email],
    );
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const bcryptPassword = await bcrypt.hash(password, salt);

    // 👈 NEW: Insert school_id into the database
    const newUser = await pool.query(
      "INSERT INTO users (full_name, email, password_hash, role, school_id) VALUES ($1, $2, $3, $4, $5) RETURNING user_id, full_name, email, role, school_id",
      [full_name, email, bcryptPassword, role, school_id],
    );

    res.json(newUser.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// --- LOGIN (NOW WITH REFRESH TOKENS) ---
router.post("/login", authLimiter, validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    // SELECT * ensures we grab the school_id from the DB
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

    // Inside router.post("/login" ...), look for the token generation:

    // 1. Short-Lived Access Token (15 mins)
    const accessToken = jwt.sign(
      {
        user_id: user.rows[0].user_id,
        role: user.rows[0].role,
        school_id: user.rows[0].school_id, // 👈 NEW: Inject the Tenant ID!
      },
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
    );

    // 2. Long-Lived Refresh Token (7 days)
    const refreshToken = jwt.sign(
      {
        user_id: user.rows[0].user_id,
        school_id: user.rows[0].school_id, // 👈 NEW: Inject the Tenant ID!
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    // 3. Send Refresh Token as a highly secure HTTP-Only Cookie
    res.cookie("refresh_token", refreshToken, {
      httpOnly: true, // Javascript cannot access this (Prevents XSS attacks)
      secure: process.env.NODE_ENV === "production", // Must be true in production (HTTPS)
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({ token: accessToken, message: "Login successful!" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// --- NEW: REFRESH TOKEN ROUTE ---
router.post("/refresh", async (req, res) => {
  try {
    // 1. Grab the refresh token from the cookie
    const refreshToken = req.cookies.refresh_token;
    if (!refreshToken)
      return res
        .status(401)
        .json({ error: "Session expired. Please log in again." });

    // 2. Verify it
    const payload = jwt.verify(refreshToken, process.env.JWT_SECRET);

    // 3. Look up the user's role AND school_id
    const user = await pool.query(
      "SELECT role, school_id FROM users WHERE user_id = $1",
      [payload.user_id],
    );
    if (user.rows.length === 0)
      return res.status(401).json({ error: "User no longer exists." });

    // 4. Issue a fresh 15-minute Access Token
    const newAccessToken = jwt.sign(
      {
        user_id: payload.user_id,
        role: user.rows[0].role,
        school_id: user.rows[0].school_id, // 👈 NEW: Ensure school_id persists across refreshes
      },
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
    );

    res.json({ token: newAccessToken });
  } catch (err) {
    res.status(401).json({ error: "Invalid refresh token." });
  }
});

// --- NEW: LOGOUT ROUTE ---
router.post("/logout", (req, res) => {
  res.clearCookie("refresh_token");
  res.json({ message: "Logged out successfully" });
});

// --- NEW: 3. FORGOT PASSWORD ---
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (user.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "If that email exists, a reset link has been sent." }); // Security best practice: don't reveal if email exists
    }

    // Generate a temporary 15-minute token
    const resetToken = jwt.sign(
      { user_id: user.rows[0].user_id },
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
    );

    // The link they will click in their email
    const resetLink = `http://localhost:5173/reset-password/${resetToken}`;

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

    // Send the email in the background
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

// --- NEW: 4. RESET PASSWORD ---
router.put("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Verify the temporary token is still valid
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Hash the new password
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const bcryptPassword = await bcrypt.hash(newPassword, salt);

    // Update the database
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
