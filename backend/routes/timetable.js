const express = require("express");
const router = express.Router();
const pool = require("../db");
const authorize = require("../middleware/authorize");

// 1. GET TIMETABLE FOR A SPECIFIC CLASS
router.get("/:class_grade", authorize, async (req, res) => {
  try {
    const { class_grade } = req.params;
    const timetable = await pool.query(
      "SELECT schedule FROM timetables WHERE class_grade = $1",
      [class_grade],
    );

    if (timetable.rows.length === 0) {
      // Return an empty template if no schedule exists yet
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
    res.status(500).send("Server Error");
  }
});

// 2. SAVE OR UPDATE A TIMETABLE (Admin Only)
router.post("/", authorize, async (req, res) => {
  try {
    if (req.user.role !== "Admin")
      return res.status(403).json({ error: "Access Denied." });

    const { class_grade, schedule } = req.body;

    // PostgreSQL "UPSERT" - Insert it, but if the class already exists, update it!
    const newTimetable = await pool.query(
      `INSERT INTO timetables (class_grade, schedule, updated_by) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (class_grade) 
       DO UPDATE SET schedule = EXCLUDED.schedule, updated_by = EXCLUDED.updated_by, updated_at = CURRENT_TIMESTAMP 
       RETURNING *`,
      [class_grade, JSON.stringify(schedule), req.user.user_id],
    );

    res.json({
      message: "Timetable successfully updated!",
      schedule: newTimetable.rows[0].schedule,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
