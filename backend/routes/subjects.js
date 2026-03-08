const express = require("express");
const router = express.Router();
const pool = require("../db");
const authorize = require("../middleware/authorize");
const { logAudit } = require("../utils/auditLogger");
const { z } = require("zod");
const validate = require("../middleware/validate");

const subjectSchema = z.object({
  subject_name: z.string().trim().min(2, "Subject name must be at least 2 characters"),
  teacher_id: z.coerce.number().positive().optional().or(z.literal("")),
});

router.post("/", authorize, validate(subjectSchema), async (req, res) => {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({ error: "Access Denied." });
    }

    const { subject_name, teacher_id } = req.body;
    const finalTeacherId = teacher_id === "" ? null : teacher_id;

    if (finalTeacherId) {
      const teacherCheck = await pool.query(
        "SELECT user_id, role, school_id FROM users WHERE user_id = $1 AND school_id = $2",
        [finalTeacherId, req.user.school_id],
      );

      if (teacherCheck.rows.length === 0) {
        return res.status(404).json({ error: "Teacher not found in your school." });
      }

      if (teacherCheck.rows[0].role !== "Teacher") {
        return res.status(400).json({ error: "Assigned user must be a teacher." });
      }
    }

    const newSubject = await pool.query(
      "INSERT INTO subjects (subject_name, teacher_id, school_id) VALUES ($1, $2, $3) RETURNING *",
      [subject_name, finalTeacherId, req.user.school_id],
    );

    await logAudit({
      userId: req.user.user_id,
      action: "CREATE_SUBJECT",
      targetTable: "subjects",
      recordId: newSubject.rows[0].subject_id,
      newValue: newSubject.rows[0],
    });

    res.json(newSubject.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

router.get("/", authorize, async (req, res) => {
  try {
    let subjects;

    if (req.user.role === "Teacher") {
      subjects = await pool.query(
        "SELECT * FROM subjects WHERE teacher_id = $1 AND school_id = $2 ORDER BY subject_name ASC",
        [req.user.user_id, req.user.school_id],
      );
    } else {
      subjects = await pool.query(
        "SELECT * FROM subjects WHERE school_id = $1 ORDER BY subject_name ASC",
        [req.user.school_id],
      );
    }

    res.json(subjects.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

router.delete("/:id", authorize, async (req, res) => {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({ error: "Access Denied. Only Admins can delete subjects." });
    }

    const { id } = req.params;
    const subjectLookup = await pool.query(
      "SELECT * FROM subjects WHERE subject_id = $1 AND school_id = $2",
      [id, req.user.school_id],
    );

    if (subjectLookup.rows.length === 0) {
      return res.status(404).json({ error: "Subject not found." });
    }

    await pool.query(
      "DELETE FROM subjects WHERE subject_id = $1 AND school_id = $2",
      [id, req.user.school_id],
    );

    await logAudit({
      userId: req.user.user_id,
      action: "DELETE_SUBJECT",
      targetTable: "subjects",
      recordId: id,
      oldValue: subjectLookup.rows[0],
    });

    res.json({ message: "Subject deleted successfully!" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
