const express = require("express");
const router = express.Router();
const pool = require("../db");
const authorize = require("../middleware/authorize");

// 1. CREATE SUBJECT
router.post("/", authorize, async (req, res) => {
  try {
    if (req.user.role !== "Admin") return res.status(403).json({ error: "Access Denied." });
    
    const { subject_name, teacher_id } = req.body;
    
    // 👈 Notice we insert req.user.school_id
    const newSubject = await pool.query(
      "INSERT INTO subjects (subject_name, teacher_id, school_id) VALUES ($1, $2, $3) RETURNING *",
      [subject_name, teacher_id, req.user.school_id] 
    );
    res.json(newSubject.rows[0]);
  } catch (err) {
    console.error(err.message); res.status(500).send("Server Error");
  }
});

// 2. GET SUBJECTS (Scoped strictly to the user's school)
router.get("/", authorize, async (req, res) => {
  try {
    let subjects;

    if (req.user.role === "Teacher") {
      // 👈 AND school_id = $2
      subjects = await pool.query(
        "SELECT * FROM subjects WHERE teacher_id = $1 AND school_id = $2", 
        [req.user.user_id, req.user.school_id] 
      );
    } else {
      // 👈 WHERE school_id = $1
      subjects = await pool.query(
        "SELECT * FROM subjects WHERE school_id = $1", 
        [req.user.school_id]
      );
    }

    res.json(subjects.rows);
  } catch (err) {
    console.error(err.message); res.status(500).send("Server Error");
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
