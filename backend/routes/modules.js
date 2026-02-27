const express = require("express");
const router = express.Router();
const pool = require("../db");
const authorize = require("../middleware/authorize");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sendEmail = require("../utils/sendEmail"); // 👈 NEW: Import Email Engine

// --- Bulletproof Folder Creation ---
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// --- MULTER CONFIGURATION ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

// --- ROUTES ---

// 1. UPLOAD A NEW MODULE & TRIGGER EMAIL
router.post("/", authorize, upload.single("module_file"), async (req, res) => {
  try {
    if (req.user.role !== "Admin" && req.user.role !== "Teacher") {
      return res.status(403).json({ error: "Access Denied." });
    }

    const { subject_id, title } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "No file was uploaded." });
    }

    const file_url = `http://localhost:5000/uploads/${req.file.filename}`;

    const newModule = await pool.query(
      "INSERT INTO modules (subject_id, title, file_url) VALUES ($1, $2, $3) RETURNING *",
      [subject_id, title, file_url],
    );

    // --- NEW: AUTOMATED EMAIL TRIGGER ---
    // 1. Get the subject name
    const subjectQuery = await pool.query(
      "SELECT subject_name FROM subjects WHERE subject_id = $1",
      [subject_id],
    );
    const subjectName = subjectQuery.rows[0]?.subject_name || "a subject";

    // 2. Fetch all Student emails
    const studentsQuery = await pool.query(
      "SELECT email, full_name FROM users WHERE role = 'Student'",
    );

    // 3. Send emails in the background
    studentsQuery.rows.forEach((student) => {
      const emailHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
          <div style="background-color: #2563EB; padding: 20px; text-align: center;">
            <h2 style="color: white; margin: 0;">📚 New Study Material</h2>
          </div>
          <div style="padding: 30px; background-color: #f9fafb;">
            <h3 style="color: #333;">Hello ${student.full_name},</h3>
            <p>A new learning module titled <strong>"${title}"</strong> has just been uploaded for <strong>${subjectName}</strong>.</p>
            <p>Please log in to your EduSync dashboard to view and download the material.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${file_url}" style="background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Document</a>
            </div>
            <p style="margin-top: 30px;">Happy Learning,<br/><strong>The EduSync Team</strong></p>
          </div>
        </div>
      `;
      sendEmail({
        to: student.email,
        subject: `New Module Uploaded: ${subjectName}`,
        html: emailHTML,
      });
    });
    // ------------------------------------

    res.json(newModule.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// 2. GET MODULES FOR A SPECIFIC SUBJECT
router.get("/:subject_id", authorize, async (req, res) => {
  try {
    const { subject_id } = req.params;
    const modules = await pool.query(
      "SELECT * FROM modules WHERE subject_id = $1 ORDER BY uploaded_at DESC",
      [subject_id],
    );
    res.json(modules.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
