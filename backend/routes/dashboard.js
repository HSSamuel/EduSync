const express = require("express");
const router = express.Router();
const authorize = require("../middleware/authorize");
const pool = require("../db");

// 1. GET USER PROFILE
router.get("/", authorize, async (req, res) => {
  try {
    const user = await pool.query(
      "SELECT full_name, role FROM users WHERE user_id = $1 AND school_id = $2",
      [req.user.user_id, req.user.school_id],
    );

    if (user.rows.length === 0)
      return res.status(404).json({ error: "User not found" });

    res.json({
      message: `Welcome back, ${user.rows[0].full_name}!`,
      full_name: user.rows[0].full_name, // 👈 Fix for secure chat identity
      your_role: user.rows[0].role,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// 2. GET ADMIN ANALYTICS STATS (Admin Only)
router.get("/stats", authorize, async (req, res) => {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({ error: "Access Denied." });
    }

    const [students, teachers, subjects, documents] = await Promise.all([
      pool.query(
        "SELECT COUNT(*) FROM students s JOIN users u ON s.user_id = u.user_id WHERE u.school_id = $1",
        [req.user.school_id],
      ),
      pool.query(
        "SELECT COUNT(*) FROM users WHERE role = 'Teacher' AND school_id = $1",
        [req.user.school_id],
      ),
      pool.query("SELECT COUNT(*) FROM subjects WHERE school_id = $1", [
        req.user.school_id,
      ]),
      pool.query("SELECT COUNT(*) FROM school_documents WHERE school_id = $1", [
        req.user.school_id,
      ]),
    ]);

    res.json({
      totalStudents: students.rows[0].count,
      totalTeachers: teachers.rows[0].count,
      totalSubjects: subjects.rows[0].count,
      totalDocuments: documents.rows[0].count,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
