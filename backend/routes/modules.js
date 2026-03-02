const express = require("express");
const router = express.Router();
const pool = require("../db");
const authorize = require("../middleware/authorize");
const multer = require("multer");
const { z } = require("zod");

const { storage } = require("../utils/cloudinary");
const { emailQueue } = require("../utils/emailQueue");

const upload = multer({ storage: storage });
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// 👈 NEW: Schema for the multipart form text fields
const moduleSchema = z.object({
  subject_id: z.coerce.number().positive("Valid Subject ID is required"),
  title: z.string().min(2, "Module title is required"),
});

router.post("/", authorize, upload.single("module_file"), async (req, res) => {
  try {
    if (req.user.role !== "Admin" && req.user.role !== "Teacher") {
      return res.status(403).json({ error: "Access Denied." });
    }

    // 👈 NEW: Validate the body fields parsed by multer
    const validation = moduleSchema.safeParse(req.body);
    if (!validation.success) {
      return res
        .status(400)
        .json({ error: "Validation Failed", details: validation.error.errors });
    }

    const { subject_id, title } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "No file was uploaded." });
    }

    const file_url = req.file.path;

    const newModule = await pool.query(
      "INSERT INTO modules (subject_id, title, file_url, school_id) VALUES ($1, $2, $3, $4) RETURNING *",
      [subject_id, title, file_url, req.user.school_id],
    );

    const subjectQuery = await pool.query(
      "SELECT subject_name FROM subjects WHERE subject_id = $1 AND school_id = $2",
      [subject_id, req.user.school_id],
    );
    const subjectName = subjectQuery.rows[0]?.subject_name || "a subject";

    const studentsQuery = await pool.query(
      "SELECT email, full_name FROM users WHERE role = 'Student' AND school_id = $1",
      [req.user.school_id],
    );

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
                  <a href="${CLIENT_URL}/dashboard" style="background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Go to Dashboard</a>
                </div>
                <p style="margin-top: 30px;">Happy Learning,<br/><strong>The EduSync Team</strong></p>
              </div>
            </div>
          `,
        },
      }));

      await emailQueue.addBulk(jobs);
    }

    res.json(newModule.rows[0]);
  } catch (err) {
    console.error("Module Upload Error:", err.message);
    res.status(500).json({ error: "Server Error while uploading module." });
  }
});

router.get("/:subject_id", authorize, async (req, res) => {
  try {
    const { subject_id } = req.params;
    const modules = await pool.query(
      "SELECT * FROM modules WHERE subject_id = $1 AND school_id = $2 ORDER BY uploaded_at DESC",
      [subject_id, req.user.school_id],
    );
    res.json(modules.rows);
  } catch (err) {
    console.error("Fetch Modules Error:", err.message);
    res.status(500).json({ error: "Server Error while fetching modules." });
  }
});

router.delete("/:id", authorize, async (req, res) => {
  try {
    if (req.user.role !== "Admin" && req.user.role !== "Teacher") {
      return res.status(403).json({ error: "Access Denied." });
    }

    const { id } = req.params;
    await pool.query(
      "DELETE FROM modules WHERE module_id = $1 AND school_id = $2",
      [id, req.user.school_id],
    );

    res.json({ message: "Module deleted successfully!" });
  } catch (err) {
    console.error("Delete Module Error:", err.message);
    res.status(500).json({ error: "Server Error while deleting module." });
  }
});

module.exports = router;
