const express = require("express");
const router = express.Router();
const pool = require("../db");
const authorize = require("../middleware/authorize");
const { permit } = require("../middleware/permissions");
const { sendError, sendSuccess } = require("../utils/response");
const validate = require("../middleware/validate");
const { z } = require("zod");
const multer = require("multer");
const { cloudinary } = require("../utils/cloudinary");

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error("Only JPG, PNG, and WEBP images are allowed."));
    }

    cb(null, true);
  },
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
});

const updateProfileSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(3, "Full name must be at least 3 characters"),
  phone_number: z
    .string()
    .trim()
    .max(30, "Phone number is too long")
    .optional()
    .or(z.literal("")),
  gender: z.enum(["Male", "Female", "Other"]).optional().or(z.literal("")),
  date_of_birth: z.string().trim().optional().or(z.literal("")),
  address: z
    .string()
    .trim()
    .max(500, "Address is too long")
    .optional()
    .or(z.literal("")),
  bio: z
    .string()
    .trim()
    .max(1000, "Bio is too long")
    .optional()
    .or(z.literal("")),
});

async function uploadBufferToCloudinary(fileBuffer, mimeType, userId) {
  const base64Image = `data:${mimeType};base64,${fileBuffer.toString("base64")}`;

  const result = await cloudinary.uploader.upload(base64Image, {
    folder: "edusync/avatars",
    public_id: `user-${userId}-${Date.now()}`,
    overwrite: true,
    resource_type: "image",
    transformation: [
      { width: 300, height: 300, crop: "fill", gravity: "face" },
      { quality: "auto" },
      { fetch_format: "auto" },
    ],
  });

  return result;
}

router.get("/me", authorize, async (req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT
          u.user_id,
          u.full_name,
          u.email,
          u.role,
          u.phone_number,
          u.gender,
          u.date_of_birth,
          u.address,
          u.bio,
          u.avatar_url,
          u.avatar_public_id,
          u.created_at,
          u.updated_at,
          s.school_name
        FROM users u
        JOIN schools s ON s.school_id = u.school_id
        WHERE u.user_id = $1 AND u.school_id = $2
        LIMIT 1
      `,
      [req.user.user_id, req.user.school_id],
    );

    if (result.rows.length === 0) {
      return sendError(res, {
        status: 404,
        message: "User profile not found.",
      });
    }

    return sendSuccess(res, {
      data: result.rows[0],
      message: "Profile fetched successfully.",
    });
  } catch (err) {
    console.error(err.message);
    return sendError(res, { status: 500, message: "Internal Server Error" });
  }
});

router.patch(
  "/me",
  authorize,
  validate(updateProfileSchema),
  async (req, res) => {
    try {
      const {
        full_name,
        phone_number = "",
        gender = "",
        date_of_birth = "",
        address = "",
        bio = "",
      } = req.body;

      const normalizedGender = gender || null;
      const normalizedDob = date_of_birth || null;
      const normalizedPhone = phone_number || null;
      const normalizedAddress = address || null;
      const normalizedBio = bio || null;

      const result = await pool.query(
        `
          UPDATE users
          SET
            full_name = $1,
            phone_number = $2,
            gender = $3,
            date_of_birth = $4,
            address = $5,
            bio = $6
          WHERE user_id = $7 AND school_id = $8
          RETURNING
            user_id,
            full_name,
            email,
            role,
            phone_number,
            gender,
            date_of_birth,
            address,
            bio,
            avatar_url,
            avatar_public_id,
            created_at,
            updated_at
        `,
        [
          full_name,
          normalizedPhone,
          normalizedGender,
          normalizedDob,
          normalizedAddress,
          normalizedBio,
          req.user.user_id,
          req.user.school_id,
        ],
      );

      if (result.rows.length === 0) {
        return sendError(res, {
          status: 404,
          message: "User profile not found.",
        });
      }

      return sendSuccess(res, {
        data: result.rows[0],
        message: "Profile updated successfully.",
      });
    } catch (err) {
      console.error(err.message);
      return sendError(res, { status: 500, message: "Internal Server Error" });
    }
  },
);

router.post(
  "/avatar",
  authorize,
  (req, res, next) => {
    upload.single("avatar")(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return sendError(res, {
            status: 400,
            message: "Avatar file is too large. Maximum size is 2MB.",
          });
        }

        return sendError(res, {
          status: 400,
          message: err.message || "Avatar upload failed.",
        });
      }

      if (err) {
        return sendError(res, {
          status: 400,
          message: err.message || "Invalid avatar upload.",
        });
      }

      next();
    });
  },
  async (req, res) => {
    try {
      if (!req.file) {
        return sendError(res, {
          status: 400,
          message: "Please select an image to upload.",
        });
      }

      const existingUser = await pool.query(
        `
          SELECT avatar_url, avatar_public_id
          FROM users
          WHERE user_id = $1 AND school_id = $2
          LIMIT 1
        `,
        [req.user.user_id, req.user.school_id],
      );

      if (existingUser.rows.length === 0) {
        return sendError(res, {
          status: 404,
          message: "User profile not found.",
        });
      }

      const previousAvatarPublicId = existingUser.rows[0].avatar_public_id;

      const uploadResult = await uploadBufferToCloudinary(
        req.file.buffer,
        req.file.mimetype,
        req.user.user_id,
      );

      const updated = await pool.query(
        `
          UPDATE users
          SET avatar_url = $1,
              avatar_public_id = $2
          WHERE user_id = $3 AND school_id = $4
          RETURNING
            user_id,
            full_name,
            email,
            role,
            avatar_url,
            avatar_public_id
        `,
        [
          uploadResult.secure_url,
          uploadResult.public_id,
          req.user.user_id,
          req.user.school_id,
        ],
      );

      if (previousAvatarPublicId) {
        cloudinary.uploader
          .destroy(previousAvatarPublicId, { resource_type: "image" })
          .catch((destroyErr) => {
            console.error(
              "Failed to remove old Cloudinary avatar:",
              destroyErr.message,
            );
          });
      }

      return sendSuccess(res, {
        data: updated.rows[0],
        message: "Avatar updated successfully.",
      });
    } catch (err) {
      console.error("Cloudinary avatar upload error:", {
        message: err?.message,
        name: err?.name,
        stack: err?.stack,
        error: err,
      });

      return sendError(res, {
        status: 500,
        message: err?.message || "Internal Server Error",
      });
    }
  },
);

router.get("/teachers", authorize, permit("Admin"), async (req, res) => {
  try {
    const teachers = await pool.query(
      `
        SELECT user_id, full_name, email
        FROM users
        WHERE role = 'Teacher' AND school_id = $1
        ORDER BY full_name ASC
      `,
      [req.user.school_id],
    );

    return sendSuccess(res, { data: teachers.rows });
  } catch (err) {
    console.error(err.message);
    return sendError(res, { status: 500, message: "Internal Server Error" });
  }
});

router.get("/parents", authorize, permit("Admin"), async (req, res) => {
  try {
    const parents = await pool.query(
      `
        SELECT user_id, full_name, email
        FROM users
        WHERE role = 'Parent' AND school_id = $1
        ORDER BY full_name ASC
      `,
      [req.user.school_id],
    );

    return sendSuccess(res, { data: parents.rows });
  } catch (err) {
    console.error(err.message);
    return sendError(res, { status: 500, message: "Internal Server Error" });
  }
});

module.exports = router;
