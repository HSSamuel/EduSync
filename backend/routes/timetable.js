const express = require("express");
const router = express.Router();
const pool = require("../db");
const authorize = require("../middleware/authorize");
const { z } = require("zod");
const validate = require("../middleware/validate");

const timetableSchema = z.object({
  class_grade: z.string().min(1, "Class Grade is required"),
  schedule: z.record(
    z.array(
      z.object({
        start_time: z.string(),
        end_time: z.string(),
        subject: z.string(),
      }),
    ),
  ),
});

// 1. GET TIMETABLE FOR A SPECIFIC CLASS
router.get("/:class_grade", authorize, async (req, res) => {
  try {
    const { class_grade } = req.params;
    const timetable = await pool.query(
      "SELECT schedule FROM timetables WHERE class_grade = $1 AND school_id = $2",
      [class_grade, req.user.school_id],
    );

    if (timetable.rows.length === 0) {
      return res.json({
        Monday: [],
        Tuesday: [],
        Wednesday: [],
        Thursday: [],
        Friday: [],
      });
    }

    res.json(timetable.rows[0].schedule);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 2. SAVE OR UPDATE A TIMETABLE (Admin Only)
router.post("/", authorize, validate(timetableSchema), async (req, res) => {
  try {
    if (req.user.role !== "Admin")
      return res.status(403).json({ error: "Access Denied." });

    const { class_grade, schedule } = req.body;

    const newTimetable = await pool.query(
      `INSERT INTO timetables (class_grade, schedule, updated_by, school_id) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (class_grade, school_id) 
       DO UPDATE SET schedule = EXCLUDED.schedule, updated_by = EXCLUDED.updated_by
       RETURNING *`,
      [
        class_grade,
        JSON.stringify(schedule),
        req.user.user_id,
        req.user.school_id,
      ],
    );

    res.json({
      message: "Timetable successfully updated!",
      schedule: newTimetable.rows[0].schedule,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;