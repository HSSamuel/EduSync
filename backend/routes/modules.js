const express = require("express");
const router = express.Router();
const pool = require("../db");
const authorize = require("../middleware/authorize");
const multer = require("multer");

// Phase 2 Integrations: Cloud Storage & Background Queues
const { storage } = require("../utils/cloudinary");
const { emailQueue } = require("../utils/emailQueue");

// Setup Multer to pipe files directly to Cloudinary
const upload = multer({ storage: storage });

// 1. UPLOAD A NEW MODULE & TRIGGER BACKGROUND EMAIL ALERTS
router.post("/", authorize, upload.single("module_file"), async (req, res) => {
  try {
    // Only Teachers and Admins can upload study materials
    if (req.user.role !== "Admin" && req.user.role !== "Teacher") {
      return res.status(403).json({ error: "Access Denied." });
    }

    const { subject_id, title } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "No file was uploaded." });
    }

    // Grab the secure URL directly from Cloudinary
    const file_url = req.file.path;

    // Save the file metadata to the PostgreSQL database
    const newModule = await pool.query(
      "INSERT INTO modules (subject_id, title, file_url) VALUES ($1, $2, $3) RETURNING *",
      [subject_id, title, file_url],
    );

    // --- BACKGROUND EMAIL TRIGGER ---
    // 1. Get the readable subject name
    const subjectQuery = await pool.query(
      "SELECT subject_name FROM subjects WHERE subject_id = $1",
      [subject_id],
    );
    const subjectName = subjectQuery.rows[0]?.subject_name || "a subject";

    // 2. Fetch all Student emails to notify them
    const studentsQuery = await pool.query(
      "SELECT email, full_name FROM users WHERE role = 'Student'",
    );

    // 3. Create the Job payloads for BullMQ
    if (studentsQuery.rows.length > 0) {
      const jobs = studentsQuery.rows.map((student) => ({
        name: "module-upload-alert",
        data: {
          to: student.email,
          subject: `📚 New Module Uploaded: ${subjectName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
              <div style="background-color: #2563EB; padding: 20px; text-align: center;">
                <h2 style="color: white; margin: 0;">New Study Material</h2>
              </div>
              <div style="padding: 30px; background-color: #f9fafb;">
                <h3 style="color: #333;">Hello ${student.full_name},</h3>
                <p>A new learning module titled <strong>"${title}"</strong> has just been uploaded for <strong>${subjectName}</strong>.</p>
                <p>Please log in to your EduSync dashboard to view and download the material.</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="http://localhost:5173/dashboard" style="background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Go to Dashboard</a>
                </div>
                <p style="margin-top: 30px;">Happy Learning,<br/><strong>The EduSync Team</strong></p>
              </div>
            </div>
          `,
        },
      }));

      // 4. Dump all jobs into the Redis queue instantly so the frontend doesn't hang
      await emailQueue.addBulk(jobs);
    }

    // Instantly return the database record to the frontend
    res.json(newModule.rows[0]);
  } catch (err) {
    console.error("Module Upload Error:", err.message);
    res.status(500).json({ error: "Server Error while uploading module." });
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
    console.error("Fetch Modules Error:", err.message);
    res.status(500).json({ error: "Server Error while fetching modules." });
  }
});

// 3. DELETE A MODULE (Optional functionality for cleanup)
router.delete("/:id", authorize, async (req, res) => {
  try {
    if (req.user.role !== "Admin" && req.user.role !== "Teacher") {
      return res.status(403).json({ error: "Access Denied." });
    }

    const { id } = req.params;
    await pool.query("DELETE FROM modules WHERE module_id = $1", [id]);

    // Note: To completely optimize this, you would also use the Cloudinary API
    // to delete the file from your cloud bucket to save space.

    res.json({ message: "Module deleted successfully!" });
  } catch (err) {
    console.error("Delete Module Error:", err.message);
    res.status(500).json({ error: "Server Error while deleting module." });
  }
});

module.exports = router;
