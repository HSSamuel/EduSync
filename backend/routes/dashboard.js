const express = require("express");
const router = express.Router();
const authorize = require("../middleware/authorize");
const pool = require("../db"); // 👈 The missing puzzle piece!

// 1. GET USER PROFILE
router.get("/", authorize, async (req, res) => {
  try {
    const user = await pool.query(
      "SELECT full_name, role FROM users WHERE user_id = $1",
      [req.user.user_id],
    );

    res.json({
      message: `Welcome back, ${user.rows[0].full_name}!`,
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

    // Run multiple counting queries at the same time for maximum speed
    const [students, teachers, subjects, documents] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM students"),
      pool.query("SELECT COUNT(*) FROM users WHERE role = 'Teacher'"),
      pool.query("SELECT COUNT(*) FROM subjects"),
      pool.query("SELECT COUNT(*) FROM school_documents"),
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
