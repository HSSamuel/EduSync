const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail"); // 👈 Import our email engine
require("dotenv").config();

// 1. REGISTER A NEW USER
router.post("/register", async (req, res) => {
  try {
    const { full_name, email, password, role } = req.body;
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const bcryptPassword = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      "INSERT INTO users (full_name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING *",
      [full_name, email, bcryptPassword, role],
    );

    res.json(newUser.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// 2. LOGIN A USER
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (user.rows.length === 0) {
      return res.status(401).json({ error: "Invalid Credentials" });
    }

    const validPassword = await bcrypt.compare(
      password,
      user.rows[0].password_hash,
    );

    if (!validPassword) {
      return res.status(401).json({ error: "Invalid Credentials" });
    }

    const token = jwt.sign(
      { user_id: user.rows[0].user_id, role: user.rows[0].role },
      process.env.JWT_SECRET,
      { expiresIn: "1hr" },
    );

    res.json({ token: token, message: "Login successful!" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
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
