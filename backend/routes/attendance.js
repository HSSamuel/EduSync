const express = require("express");
const router = express.Router();
const pool = require("../db");
const authorize = require("../middleware/authorize");
const sendEmail = require("../utils/sendEmail"); // 👈 The magic email engine!

// 1. SUBMIT DAILY ATTENDANCE (Teachers & Admins)
router.post("/", authorize, async (req, res) => {
  try {
    if (req.user.role !== "Admin" && req.user.role !== "Teacher") {
      return res.status(403).json({ error: "Access Denied." });
    }

    const { date, attendanceList } = req.body;
    // attendanceList is an array of objects: [{ student_id: 1, status: "Present" }, ...]

    // Loop through the list submitted by the teacher
    for (let record of attendanceList) {
      // 1. Insert the record into the database
      await pool.query(
        "INSERT INTO attendance (student_id, date, status) VALUES ($1, $2, $3)",
        [record.student_id, date, record.status],
      );

      // 2. The Smart Trigger: If Absent, alert the Parent!
      if (record.status === "Absent") {
        // Find this specific student's Parent's email
        const parentQuery = await pool.query(
          `
          SELECT u.email, u.full_name AS parent_name, s_user.full_name AS student_name
          FROM students s
          JOIN users u ON s.parent_id = u.user_id
          JOIN users s_user ON s.user_id = s_user.user_id
          WHERE s.student_id = $1
        `,
          [record.student_id],
        );

        // If they have a parent linked, send the email!
        if (parentQuery.rows.length > 0) {
          const parent = parentQuery.rows[0];

          const emailHTML = `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
              <div style="background-color: #EF4444; padding: 20px; text-align: center;">
                <h2 style="color: white; margin: 0;">Attendance Alert</h2>
              </div>
              <div style="padding: 30px; background-color: #f9fafb;">
                <h3 style="color: #333;">Dear ${parent.parent_name},</h3>
                <p>This is an automated notification from EduSync to inform you that <strong>${parent.student_name}</strong> was marked <strong>Absent</strong> for classes on <strong>${date}</strong>.</p>
                <p>If you have any questions or this is a mistake, please contact the administration office.</p>
              </div>
            </div>
          `;

          // Send in the background
          sendEmail({
            to: parent.email,
            subject: `⚠️ Attendance Alert: ${parent.student_name} marked Absent`,
            html: emailHTML,
          });
        }
      }
    }

    res.json({ message: "Attendance saved and parent alerts dispatched!" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
