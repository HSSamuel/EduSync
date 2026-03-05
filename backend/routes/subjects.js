const express = require("express");
const router = express.Router();
const pool = require("../db");
const authorize = require("../middleware/authorize");
const { z } = require("zod");
const validate = require("../middleware/validate");

// 👈 NEW: Validation schema for subjects
const subjectSchema = z.object({
  subject_name: z.string().min(2, "Subject name must be at least 2 characters"),
  teacher_id: z.coerce.number().positive().optional().or(z.literal("")), // Can be a number or an empty string if unassigned
});

// 1. CREATE SUBJECT
router.post("/", authorize, validate(subjectSchema), async (req, res) => {
  try {
    if (req.user.role !== "Admin") return res.status(403).json({ error: "Access Denied." });
    
    const { subject_name, teacher_id } = req.body;
    
    // Convert empty string to null for the database
    const finalTeacherId = teacher_id === "" ? null : teacher_id;
    
    const newSubject = await pool.query(
      "INSERT INTO subjects (subject_name, teacher_id, school_id) VALUES ($1, $2, $3) RETURNING *",
      [subject_name, finalTeacherId, req.user.school_id] 
    );
    res.json(newSubject.rows[0]);
  } catch (err) {
    console.error(err.message); 
    res.status(500).send("Server Error");
  }
});

// 2. GET SUBJECTS (Scoped strictly to the user's school)
router.get("/", authorize, async (req, res) => {
  try {
    let subjects;

    if (req.user.role === "Teacher") {
      subjects = await pool.query(
        "SELECT * FROM subjects WHERE teacher_id = $1 AND school_id = $2", 
        [req.user.user_id, req.user.school_id] 
      );
    } else {
      subjects = await pool.query(
        "SELECT * FROM subjects WHERE school_id = $1", 
        [req.user.school_id]
      );
    }

    res.json(subjects.rows);
  } catch (err) {
    console.error(err.message); 
    res.status(500).send("Server Error");
  }
});

// 3. DELETE SUBJECT
router.delete("/:id", authorize, async (req, res) => {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({ error: "Access Denied. Only Admins can delete subjects." });
    }
    const { id } = req.params;
    // 👈 SECURED: Added school_id to prevent deleting another school's subject
    await pool.query("DELETE FROM subjects WHERE subject_id = $1 AND school_id = $2", [id, req.user.school_id]);
    res.json({ message: "Subject deleted successfully!" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;