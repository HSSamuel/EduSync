const express = require("express");
const router = express.Router();
const pool = require("../db");
const authorize = require("../middleware/authorize");
const { emailQueue } = require("../utils/emailQueue");

router.post("/", authorize, async (req, res) => {
  try {
    if (req.user.role !== "Admin" && req.user.role !== "Teacher") {
      return res.status(403).json({ error: "Access Denied." });
    }

    const { date, attendanceList } = req.body;
    if (!attendanceList || attendanceList.length === 0) {
      return res.status(400).json({ error: "No attendance data provided." });
    }

    const values = [];
    const queryParams = [];
    let paramIndex = 1;

    // 👈 NEW: Inject the school_id into every row generated
    attendanceList.forEach((record) => {
      values.push(
        `($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`,
      );
      queryParams.push(
        record.student_id,
        date,
        record.status,
        req.user.school_id,
      );
    });

    const insertQuery = `INSERT INTO attendance (student_id, date, status, school_id) VALUES ${values.join(", ")}`;
    await pool.query(insertQuery, queryParams);

    const absentStudentIds = attendanceList
      .filter((record) => record.status === "Absent")
      .map((record) => record.student_id);

    if (absentStudentIds.length > 0) {
      const parentQuery = await pool.query(
        `
        SELECT u.email, u.full_name AS parent_name, s_user.full_name AS student_name
        FROM students s
        JOIN users u ON s.parent_id = u.user_id
        JOIN users s_user ON s.user_id = s_user.user_id
        WHERE s.student_id = ANY($1::int[]) AND u.school_id = $2
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

    res.json({ message: "Attendance saved and parent alerts dispatched!" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
