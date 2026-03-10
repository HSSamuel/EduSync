const express = require("express");
const router = express.Router();
const pool = require("../db");
const authorize = require("../middleware/authorize");
const { cloudinary } = require("../utils/cloudinary");
const { z } = require("zod");
const validate = require("../middleware/validate");
const { Readable } = require("stream");
const { createMemoryUpload } = require("../utils/uploadConfig");
const { sendError, sendSuccess } = require("../utils/response");

const upload = createMemoryUpload("modules");

const createModuleSchema = z.object({
  subject_id: z.coerce.number().int().positive("A valid subject is required"),
  title: z
    .string()
    .trim()
    .min(2, "Module title is required")
    .max(255, "Module title is too long"),
});

router.post(
  "/",
  authorize,
  upload.single("file"),
  validate(createModuleSchema),
  async (req, res, next) => {
    try {
      if (req.user.role !== "Admin" && req.user.role !== "Teacher") {
        return sendError(res, { status: 403, message: "Access Denied.", code: "FORBIDDEN" });
      }

      if (!req.file) {
        return sendError(res, { status: 400, message: "A file upload is required.", code: "FILE_REQUIRED" });
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
        return sendError(res, { status: 404, message: "Subject not found in your school.", code: "SUBJECT_NOT_FOUND" });
      }

      if (
        req.user.role === "Teacher" &&
        subjectQuery.rows[0].teacher_id !== req.user.user_id
      ) {
        return sendError(res, {
          status: 403,
          message: "You can only upload modules for subjects assigned to you.",
          code: "FORBIDDEN",
        });
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
          INSERT INTO modules (
            subject_id,
            title,
            file_url,
            file_public_id,
            file_resource_type,
            school_id
          )
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `,
        [
          subject_id,
          title,
          uploadResult.secure_url,
          uploadResult.public_id,
          uploadResult.resource_type || req.file.mimetype?.split("/")[0] || "raw",
          req.user.school_id,
        ],
      );

      return sendSuccess(res, {
        status: 201,
        message: "Module uploaded successfully.",
        data: newModule.rows[0],
      });
    } catch (err) {
      return next(err);
    }
  },
);

router.get("/", authorize, async (req, res, next) => {
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

    return sendSuccess(res, { data: modules.rows });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
