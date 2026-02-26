const express = require("express");
const router = express.Router();
const pool = require("../db");
const authorize = require("../middleware/authorize");

// 1. CREATE SUBJECT (Located at /api/subjects)
router.post("/", authorize, async (req, res) => {
  try {
    if (req.user.role !== "Admin") {
      return res
        .status(403)
        .json({ error: "Access Denied. Only Admins can create subjects." });
    }
    const { subject_name, teacher_id } = req.body;
    const newSubject = await pool.query(
      "INSERT INTO subjects (subject_name, teacher_id) VALUES ($1, $2) RETURNING *",
      [subject_name, teacher_id],
    );
    res.json(newSubject.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// 2. GET ALL SUBJECTS (Located at /api/subjects)
router.get("/", authorize, async (req, res) => {
  try {
    const allSubjects = await pool.query("SELECT * FROM subjects");
    res.json(allSubjects.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// 3. DELETE SUBJECT (Located at /api/subjects/:id)
router.delete("/:id", authorize, async (req, res) => {
  try {
    if (req.user.role !== "Admin") {
      return res
        .status(403)
        .json({ error: "Access Denied. Only Admins can delete subjects." });
    }
    const { id } = req.params;
    await pool.query("DELETE FROM subjects WHERE subject_id = $1", [id]);
    res.json({ message: "Subject deleted successfully!" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
