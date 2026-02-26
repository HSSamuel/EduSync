const express = require("express");
const router = express.Router();
const pool = require("../db");
const authorize = require("../middleware/authorize");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// --- NEW: Bulletproof Folder Creation ---
// This safely points to backend/uploads, no matter where the server is started from
const uploadDir = path.join(__dirname, "../uploads");

// If the folder doesn't exist, the server will build it right now!
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// --- MULTER CONFIGURATION (Only one block now!) ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // 👈 Tell Multer to use our absolute path
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// --- ROUTES ---

// 1. UPLOAD A NEW MODULE (Admin only for now)
router.post("/", authorize, upload.single("module_file"), async (req, res) => {
  try {
    if (req.user.role !== "Admin") {
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
