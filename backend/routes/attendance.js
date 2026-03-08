const express = require("express");
const router = express.Router();
const pool = require("../db");
const authorize = require("../middleware/authorize");
const { emailQueue } = require("../utils/emailQueue");
const { z } = require("zod");

const attendanceRecordSchema = z.object({
  student_id: z.coerce.number().int().positive(),
  status: z.enum(["Present", "Absent", "Late", "Excused"]),
});

const newAttendanceSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  records: z
    .array(attendanceRecordSchema)
    .min(1, "At least one attendance record is required"),
});

const legacyAttendanceItemSchema = z.object({
  student_id: z.coerce.number().int().positive(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  status: z.enum(["Present", "Absent", "Late", "Excused"]),
});

const legacyAttendanceSchema = z.object({
  attendanceList: z
    .array(legacyAttendanceItemSchema)
    .min(1, "At least one attendance record is required"),
});

function normalizeAttendancePayload(body) {
  const newShape = newAttendanceSchema.safeParse(body);
  if (newShape.success) {
    return {
      date: newShape.data.date,
      records: newShape.data.records,
    };
  }

  const legacyShape = legacyAttendanceSchema.safeParse(body);
  if (legacyShape.success) {
    const attendanceList = legacyShape.data.attendanceList;
    const firstDate = attendanceList[0]?.date;

    const mixedDates = attendanceList.some((item) => item.date !== firstDate);
    if (mixedDates) {
      return {
        error: "All legacy attendance records must have the same date.",
        details: [
          {
            path: "attendanceList",
            message: "All attendance entries must share the same date.",
          },
        ],
      };
    }

    return {
      date: firstDate,
      records: attendanceList.map(({ student_id, status }) => ({
        student_id,
        status,
      })),
    };
  }

  const issues = [
    ...(newShape.error?.issues || []),
    ...(legacyShape.error?.issues || []),
  ];

  return {
    error:
      issues[0]?.message ||
      "Invalid attendance payload. Expected either { date, records } or { attendanceList }.",
    details: issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    })),
  };
}

router.get("/", authorize, async (req, res) => {
  try {
    const { class_grade = "", date = "", status = "" } = req.query;

    let query = `
      SELECT
        a.attendance_id,
        a.student_id,
        u.full_name,
        s.class_grade,
        a.date,
        a.status
      FROM attendance a
      JOIN students s ON a.student_id = s.student_id
      JOIN users u ON s.user_id = u.user_id
      WHERE a.school_id = $1
    `;

    const params = [req.user.school_id];
    let paramIndex = 2;

    if (class_grade) {
      query += ` AND s.class_grade = $${paramIndex}`;
      params.push(class_grade);
      paramIndex += 1;
    }

    if (date) {
      query += ` AND a.date = $${paramIndex}`;
      params.push(date);
      paramIndex += 1;
    }

    if (status) {
      query += ` AND a.status = $${paramIndex}`;
      params.push(status);
      paramIndex += 1;
    }

    query += ` ORDER BY a.date DESC, s.class_grade ASC, u.full_name ASC`;

    const attendance = await pool.query(query, params);
    res.json(attendance.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/", authorize, async (req, res) => {
  const client = await pool.connect();

  try {
    if (!["Admin", "Teacher"].includes(req.user.role)) {
      return res.status(403).json({ error: "Access Denied." });
    }

    const normalized = normalizeAttendancePayload(req.body);

    if (normalized.error) {
      return res.status(400).json({
        error: normalized.error,
        details: normalized.details || [],
      });
    }

    const { date, records: attendanceList } = normalized;
    const studentIds = attendanceList.map((record) => record.student_id);

    const studentScopeCheck = await client.query(
      `
        SELECT s.student_id
        FROM students s
        JOIN users u ON s.user_id = u.user_id
        WHERE s.student_id = ANY($1::int[])
          AND u.school_id = $2
      `,
      [studentIds, req.user.school_id],
    );

    if (studentScopeCheck.rows.length !== studentIds.length) {
      return res.status(400).json({
        error: "One or more students do not belong to your school.",
      });
    }

    await client.query("BEGIN");

    for (const record of attendanceList) {
      await client.query(
        `
          INSERT INTO attendance (student_id, date, status, school_id)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (student_id, date, school_id)
          DO UPDATE SET status = EXCLUDED.status
        `,
        [record.student_id, date, record.status, req.user.school_id],
      );
    }

    const absentStudentIds = attendanceList
      .filter((record) => record.status === "Absent")
      .map((record) => record.student_id);

    if (absentStudentIds.length > 0) {
      const parentQuery = await client.query(
        `
          SELECT
            u.email,
            u.full_name AS parent_name,
            s_user.full_name AS student_name
          FROM students s
          JOIN users u ON s.parent_id = u.user_id
          JOIN users s_user ON s.user_id = s_user.user_id
          WHERE s.student_id = ANY($1::int[])
            AND u.school_id = $2
        `,
        [absentStudentIds, req.user.school_id],
      );

      const jobs = parentQuery.rows.map((parent) => ({
        name: "attendance-alert",
        data: {
          to: parent.email,
          subject: `⚠️ Attendance Alert: ${parent.student_name} marked Absent`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
              <div style="background-color: #EF4444; padding: 20px; text-align: center;">
                <h2 style="color: white; margin: 0;">Attendance Alert</h2>
              </div>
              <div style="padding: 30px; background-color: #f9fafb;">
                <h3 style="color: #333;">Dear ${parent.parent_name},</h3>
                <p>This is an automated notification from EduSync to inform you that <strong>${parent.student_name}</strong> was marked <strong>Absent</strong> for classes on <strong>${date}</strong>.</p>
              </div>
            </div>
          `,
        },
      }));

      await emailQueue.addBulk(jobs);
    }

    await client.query("COMMIT");
    res.json({ message: "Attendance saved and parent alerts dispatched!" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err.message);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
});

module.exports = router;
