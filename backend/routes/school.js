const express = require("express");
const router = express.Router();
const pool = require("../db");
const authorize = require("../middleware/authorize");
const multer = require("multer");
const sendEmail = require("../utils/sendEmail");
const { storage } = require("../utils/cloudinary"); 
const { emailQueue } = require("../utils/emailQueue");

// Replace local storage with Cloudinary storage
const upload = multer({ storage: storage });

// 1. UPLOAD A GLOBAL DOCUMENT (Admin Only)
router.post(
  "/documents",
  authorize,
  upload.single("document_file"),
  async (req, res) => {
    try {
      if (req.user.role !== "Admin")
        return res.status(403).json({ error: "Access Denied." });

      const { title } = req.body;
      if (!req.file)
        return res.status(400).json({ error: "No file was uploaded." });

      // --- FIX: GRAB THE CLOUDINARY URL ---
      const file_url = req.file.path;

      const newDoc = await pool.query(
        "INSERT INTO school_documents (title, file_url, uploaded_by) VALUES ($1, $2, $3) RETURNING *",
        [title, file_url, req.user.user_id],
      );
      res.json(newDoc.rows[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  },
);

// 2. GET ALL GLOBAL DOCUMENTS (All Users)
router.get("/documents", authorize, async (req, res) => {
  try {
    const docs = await pool.query(
      "SELECT * FROM school_documents ORDER BY uploaded_at DESC",
    );
    res.json(docs.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// 3. DELETE A DOCUMENT (Admin Only)
router.delete("/documents/:id", authorize, async (req, res) => {
  try {
    if (req.user.role !== "Admin")
      return res.status(403).json({ error: "Access Denied." });
    await pool.query("DELETE FROM school_documents WHERE doc_id = $1", [
      req.params.id,
    ]);
    res.json({ message: "Document deleted successfully!" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// 4. SEND MASS BROADCAST (Admin Only)
router.post("/broadcast", authorize, async (req, res) => {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({ error: "Access Denied." });
    }

    const { audience, subject, message } = req.body;

    let query = "SELECT email, full_name FROM users WHERE role != 'Admin'";
    let queryParams = [];

    if (audience !== "All") {
      query = "SELECT email, full_name FROM users WHERE role = $1";
      queryParams = [audience];
    }

    const targetUsers = await pool.query(query, queryParams);

    if (targetUsers.rows.length === 0) {
      return res.status(400).json({ error: "No users found in this audience category." });
    }

    // --- FIX: ADD JOBS TO THE REDIS QUEUE INSTEAD OF AWAITING THEM ---
    const jobs = targetUsers.rows.map((user) => ({
      name: "broadcast-email",
      data: {
        to: user.email,
        subject: subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
            <div style="background-color: #2563EB; padding: 20px; text-align: center;">
              <h2 style="color: white; margin: 0;">📢 EduSync Official Broadcast</h2>
            </div>
            <div style="padding: 30px; background-color: #f9fafb;">
              <h3 style="color: #333;">Dear ${user.full_name},</h3>
              <p style="white-space: pre-wrap;">${message}</p>
              <p style="margin-top: 30px;">Warm regards,<br/><strong>The Administration Team</strong></p>
            </div>
          </div>
        `,
      },
    }));

    // Add all jobs to the queue at once
    await emailQueue.addBulk(jobs);

    // Instantly respond to the frontend
    res.json({ message: `✅ Broadcast queued successfully! Dispatching to ${targetUsers.rows.length} recipient(s) in the background.` });

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// ==========================================
// INTERACTIVE CALENDAR ROUTES
// ==========================================

// 5. GET ALL EVENTS (All Users)
router.get("/events", authorize, async (req, res) => {
  try {
    const events = await pool.query(
      "SELECT * FROM events ORDER BY event_date ASC",
    );
    res.json(events.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// 6. ADD A NEW EVENT (Admin Only)
router.post("/events", authorize, async (req, res) => {
  try {
    if (req.user.role !== "Admin")
      return res.status(403).json({ error: "Access Denied." });

    const { title, event_date, event_type } = req.body;
    const newEvent = await pool.query(
      "INSERT INTO events (title, event_date, event_type, created_by) VALUES ($1, $2, $3, $4) RETURNING *",
      [title, event_date, event_type, req.user.user_id],
    );
    res.json(newEvent.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// 7. DELETE AN EVENT (Admin Only)
router.delete("/events/:id", authorize, async (req, res) => {
  try {
    if (req.user.role !== "Admin")
      return res.status(403).json({ error: "Access Denied." });

    await pool.query("DELETE FROM events WHERE event_id = $1", [req.params.id]);
    res.json({ message: "Event deleted!" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
