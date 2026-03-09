const express = require("express");
const router = express.Router();
const pool = require("../db");
const authorize = require("../middleware/authorize");
const validate = require("../middleware/validate");
const {
  timetableSchema,
  allowedWeekdays,
} = require("../utils/schoolValidation");
const { logAudit } = require("../utils/auditLogger");
const { sendError, sendSuccess } = require("../utils/response");

function normalizeSchedule(schedule = {}) {
  const normalized = {};

  for (const day of allowedWeekdays) {
    const daySlots = Array.isArray(schedule[day]) ? schedule[day] : [];

    normalized[day] = [...daySlots].sort((a, b) =>
      String(a.start_time).localeCompare(String(b.start_time)),
    );
  }

  return normalized;
}

router.get("/:class_grade", authorize, async (req, res) => {
  try {
    const { class_grade } = req.params;

    const timetable = await pool.query(
      "SELECT schedule FROM timetables WHERE class_grade = $1 AND school_id = $2",
      [class_grade, req.user.school_id],
    );

    if (timetable.rows.length === 0) {
      return sendSuccess(res, { data: normalizeSchedule() });
    }

    return sendSuccess(res, { data: normalizeSchedule(timetable.rows[0].schedule) });
  } catch (err) {
    console.error("Error fetching timetable:", err.message);
    return sendError(res, { status: 500, message: "Internal Server Error" });
  }
});

router.post("/", authorize, validate(timetableSchema), async (req, res) => {
  try {
    if (req.user.role !== "Admin") {
      return sendError(res, { status: 403, message: "Access Denied." });
    }

    const { class_grade, schedule } = req.body;
    const normalizedSchedule = normalizeSchedule(schedule);

    const existing = await pool.query(
      "SELECT timetable_id, schedule FROM timetables WHERE class_grade = $1 AND school_id = $2",
      [class_grade, req.user.school_id],
    );

    const result = await pool.query(
      `INSERT INTO timetables (class_grade, schedule, updated_by, school_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (class_grade, school_id)
       DO UPDATE SET
         schedule = EXCLUDED.schedule,
         updated_by = EXCLUDED.updated_by
       RETURNING *`,
      [class_grade, normalizedSchedule, req.user.user_id, req.user.school_id],
    );

    const saved = result.rows[0];

    await logAudit({
      userId: req.user.user_id,
      action:
        existing.rows.length > 0 ? "UPDATE_TIMETABLE" : "CREATE_TIMETABLE",
      targetTable: "timetables",
      recordId: saved.timetable_id,
      oldValue: existing.rows[0]?.schedule || null,
      newValue: saved.schedule,
    });

    return sendSuccess(res, {
      message: "Timetable saved successfully.",
      data: { schedule: normalizeSchedule(saved.schedule) },
    });
  } catch (err) {
    console.error("Error saving timetable:", err.message);
    return sendError(res, { status: 500, message: "Internal Server Error" });
  }
});

module.exports = router;
