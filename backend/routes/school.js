const express = require("express");
const router = express.Router();
const pool = require("../db");
const authorize = require("../middleware/authorize");
const multer = require("multer");
const { storage, cloudinary } = require("../utils/cloudinary");
const { emailQueue } = require("../utils/emailQueue");

const upload = multer({ storage: storage });

router.post(
  "/documents",
  authorize,
  upload.single("document_file"),
  async (req, res, next) => {
    try {
      if (req.user.role !== "Admin") return res.status(403).json({ error: "Access Denied." });

      const { title } = req.body;
      if (!req.file) return res.status(400).json({ error: "No file was uploaded." });

      const file_url = req.file.path;

      const newDoc = await pool.query(
        "INSERT INTO school_documents (title, file_url, uploaded_by, school_id) VALUES ($1, $2, $3, $4) RETURNING *",
        [title, file_url, req.user.user_id, req.user.school_id],
      );
      res.json(newDoc.rows[0]);
    } catch (err) {
      next(err);
    }
  },
);

router.get("/documents", authorize, async (req, res, next) => {
  try {
    const docs = await pool.query(
      "SELECT * FROM school_documents WHERE school_id = $1 ORDER BY uploaded_at DESC",
      [req.user.school_id],
    );
    res.json(docs.rows);
  } catch (err) {
    next(err);
  }
});

router.delete("/documents/:id", authorize, async (req, res, next) => {
  try {
    if (req.user.role !== "Admin") return res.status(403).json({ error: "Access Denied." });

    const docQuery = await pool.query(
      "SELECT file_url FROM school_documents WHERE doc_id = $1 AND school_id = $2",
      [req.params.id, req.user.school_id]
    );

    if (docQuery.rows.length === 0) return res.status(404).json({ error: "Document not found" });

    const fileUrl = docQuery.rows[0].file_url;

    const urlParts = fileUrl.split('/');
    const fileWithExt = urlParts[urlParts.length - 1];
    const publicId = `edusync_vault/${fileWithExt.split('.')[0]}`;

    await cloudinary.uploader.destroy(publicId);

    await pool.query(
      "DELETE FROM school_documents WHERE doc_id = $1 AND school_id = $2",
      [req.params.id, req.user.school_id],
    );
    res.json({ message: "Document deleted successfully from DB and Cloudinary!" });
  } catch (err) {
    next(err);
  }
});

router.post("/broadcast", authorize, async (req, res, next) => {
  try {
    if (req.user.role !== "Admin") return res.status(403).json({ error: "Access Denied." });

    const { audience, subject, message } = req.body;

    let query = "SELECT email, full_name FROM users WHERE role != 'Admin' AND school_id = $1";
    let queryParams = [req.user.school_id];

    if (audience !== "All") {
      query = "SELECT email, full_name FROM users WHERE role = $2 AND school_id = $1";
      queryParams = [req.user.school_id, audience];
    }

    const targetUsers = await pool.query(query, queryParams);

    if (targetUsers.rows.length === 0) {
      return res.status(400).json({ error: "No users found in this audience category." });
    }

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

    await emailQueue.addBulk(jobs);

    res.json({
      message: `✅ Broadcast queued successfully! Dispatching to ${targetUsers.rows.length} recipient(s) in the background.`,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/events", authorize, async (req, res, next) => {
  try {
    const events = await pool.query(
      "SELECT * FROM events WHERE school_id = $1 ORDER BY event_date ASC",
      [req.user.school_id],
    );
    res.json(events.rows);
  } catch (err) {
    next(err);
  }
});

router.post("/events", authorize, async (req, res, next) => {
  try {
    if (req.user.role !== "Admin") return res.status(403).json({ error: "Access Denied." });

    const { title, event_date, event_type } = req.body;

    const newEvent = await pool.query(
      "INSERT INTO events (title, event_date, event_type, created_by, school_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [title, event_date, event_type, req.user.user_id, req.user.school_id],
    );
    res.json(newEvent.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete("/events/:id", authorize, async (req, res, next) => {
  try {
    if (req.user.role !== "Admin") return res.status(403).json({ error: "Access Denied." });

    await pool.query(
      "DELETE FROM events WHERE event_id = $1 AND school_id = $2",
      [req.params.id, req.user.school_id],
    );
    res.json({ message: "Event deleted!" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;