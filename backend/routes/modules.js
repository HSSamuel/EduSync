const express = require("express");
const router = express.Router();
const pool = require("../db");
const authorize = require("../middleware/authorize");
const cloudinary = require("../utils/cloudinary");
const { z } = require("zod");
const validate = require("../middleware/validate");
const multer = require("multer");
const { Readable } = require("stream");

const MAX_MODULE_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MODULE_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_MODULE_FILE_SIZE,
  },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MODULE_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error("Unsupported file type. Upload a PDF, Office document, text file, CSV, or image."));
    }

    cb(null, true);
  },
});

const createModuleSchema = z.object({
  subject_id: z.coerce.number().int().positive("A valid subject is required"),
  title: z.string().trim().min(2, "Module title is required").max(255, "Module title is too long"),
});

router.post(
  "/",
  authorize,
  upload.single("file"),
  validate(createModuleSchema),
  async (req, res) => {
    try {
      if (req.user.role !== "Admin" && req.user.role !== "Teacher") {
        return res.status(403).json({ error: "Access Denied." });
      }

      if (!req.file) {
        return res.status(400).json({ error: "A file upload is required." });
      }

      const { subject_id, title } = req.body;

      const subjectQuery = await pool.query(
        `
          SELECT subject_id, subject_name, teacher_id
          FROM subjects
          WHERE subject_id = $1 AND school_id = $2
        `,
        [subject_id, req.user.school_id],
      );

      if (subjectQuery.rows.length === 0) {
        return res.status(404).json({ error: "Subject not found in your school." });
      }

      if (
        req.user.role === "Teacher" &&
        subjectQuery.rows[0].teacher_id !== req.user.user_id
      ) {
        return res.status(403).json({ error: "You can only upload modules for subjects assigned to you." });
      }

      const streamUpload = () =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "edusync/modules",
              resource_type: "auto",
              use_filename: true,
              unique_filename: true,
              filename_override: title,
            },
            (error, result) => {
              if (result) resolve(result);
              else reject(error);
            },
          );

          Readable.from(req.file.buffer).pipe(stream);
        });

      const uploadResult = await streamUpload();

      const newModule = await pool.query(
        `
          INSERT INTO modules (subject_id, title, file_url, school_id)
          VALUES ($1, $2, $3, $4)
          RETURNING *
        `,
        [subject_id, title, uploadResult.secure_url, req.user.school_id],
      );

      res.json(newModule.rows[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: err.message || "Internal Server Error" });
    }
  },
);

router.get("/", authorize, async (req, res) => {
  try {
    let query = `
      SELECT m.*, s.subject_name
      FROM modules m
      JOIN subjects s ON m.subject_id = s.subject_id
      WHERE m.school_id = $1
    `;
    const params = [req.user.school_id];

    if (req.user.role === "Teacher") {
      query += " AND s.teacher_id = $2";
      params.push(req.user.user_id);
    }

    query += " ORDER BY m.uploaded_at DESC";

    const modules = await pool.query(query, params);

    res.json(modules.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
