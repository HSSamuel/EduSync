const express = require("express");
const router = express.Router();
const pool = require("../db");
const authorize = require("../middleware/authorize");
const { emailQueue } = require("../utils/emailQueue"); // Use background queue
const { z } = require("zod");
const validate = require("../middleware/validate");

const createGradeSchema = z.object({
  student_id: z.coerce.number().positive(),
  subject_id: z.coerce.number().positive(),
  academic_term: z.string().min(1, "Academic term is required"),
  test_score: z.coerce.number().min(0).max(40, "Test score cannot exceed 40"),
  exam_score: z.coerce.number().min(0).max(60, "Exam score cannot exceed 60"),
});

const updateGradeSchema = z.object({
  test_score: z.coerce.number().min(0).max(40, "Test score cannot exceed 40"),
  exam_score: z.coerce.number().min(0).max(60, "Exam score cannot exceed 60"),
});

const getGradeEmailHTML = (
  recipientName,
  subjectName,
  term,
  isUpdate = false,
) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
    <div style="background-color: #9333EA; padding: 20px; text-align: center;">
      <h2 style="color: white; margin: 0;">📊 ${isUpdate ? "Grade Updated" : "New Grade Published"}</h2>
    </div>
    <div style="padding: 30px; background-color: #f9fafb;">
      <h3 style="color: #333;">Hello ${recipientName},</h3>
      <p>An academic result for <strong>${subjectName}</strong> (${term}) has been ${isUpdate ? "updated" : "published"} to your profile.</p>
      <p>Please log in to the EduSync portal to view the updated report card and total percentages.</p>
      <p style="margin-top: 30px;">Warm regards,<br/><strong>The Administration Team</strong></p>
    </div>
  </div>
`;

// 1. ADD A STUDENT'S GRADE
router.post("/", authorize, validate(createGradeSchema), async (req, res) => {
  try {
    if (req.user.role !== "Admin" && req.user.role !== "Teacher") {
      return res.status(403).json({ error: "Access Denied." });
    }

    const { student_id, subject_id, academic_term, test_score, exam_score } =
      req.body;

    // 👈 NEW: Tag result with school_id
    const newResult = await pool.query(
      "INSERT INTO results (student_id, subject_id, academic_term, test_score, exam_score, school_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [
        student_id,
        subject_id,
        academic_term,
        test_score,
        exam_score,
        req.user.school_id,
      ],
    );

    const detailsQuery = await pool.query(
      `
      SELECT u.email AS student_email, u.full_name AS student_name, p.email AS parent_email, p.full_name AS parent_name, sub.subject_name
      FROM students s
      JOIN users u ON s.user_id = u.user_id
      LEFT JOIN users p ON s.parent_id = p.user_id
      JOIN subjects sub ON sub.subject_id = $1
      WHERE s.student_id = $2 AND u.school_id = $3
      `,
      [subject_id, student_id, req.user.school_id],
    );

    if (detailsQuery.rows.length > 0) {
      const details = detailsQuery.rows[0];
      const jobs = [];

      if (details.student_email) {
        jobs.push({
          name: "grade-alert",
          data: {
            to: details.student_email,
            subject: `New Grade: ${details.subject_name}`,
            html: getGradeEmailHTML(
              details.student_name,
              details.subject_name,
              academic_term,
            ),
          },
        });
      }
      if (details.parent_email) {
        jobs.push({
          name: "grade-alert",
          data: {
            to: details.parent_email,
            subject: `New Grade for ${details.student_name}: ${details.subject_name}`,
            html: getGradeEmailHTML(
              details.parent_name,
              details.subject_name,
              academic_term,
            ),
          },
        });
      }
      await emailQueue.addBulk(jobs); // Fast queue processing
    }

    res.json(newResult.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error.");
  }
});

// 2. GET A SPECIFIC STUDENT'S REPORT CARD
router.get("/student/:student_id", authorize, async (req, res) => {
  try {
    const { student_id } = req.params;
    // 👈 NEW: Verify school_id
    const reportCard = await pool.query(
      `
      SELECT r.result_id, s.subject_name, r.academic_term, r.test_score, r.exam_score, r.total_score
      FROM results r JOIN subjects s ON r.subject_id = s.subject_id 
      WHERE r.student_id = $1 AND r.school_id = $2
    `,
      [student_id, req.user.school_id],
    );
    res.json(reportCard.rows);
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

// 3. GET A LOGGED-IN STUDENT'S OWN GRADES
router.get("/me", authorize, async (req, res) => {
  try {
    const myGrades = await pool.query(
      `
      SELECT r.result_id, s.subject_name, r.academic_term, r.test_score, r.exam_score, r.total_score
      FROM results r 
      JOIN subjects s ON r.subject_id = s.subject_id 
      JOIN students st ON r.student_id = st.student_id
      WHERE st.user_id = $1 AND r.school_id = $2
    `,
      [req.user.user_id, req.user.school_id],
    );
    res.json(myGrades.rows);
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

// 4. UPDATE A GRADE & TRIGGER EMAIL
router.put("/:id", authorize, validate(updateGradeSchema), async (req, res) => {
  try {
    if (req.user.role !== "Admin" && req.user.role !== "Teacher")
      return res.status(403).json({ error: "Access Denied." });

    const { id } = req.params;
    const { test_score, exam_score } = req.body;

    const oldRecordQuery = await pool.query(
      "SELECT * FROM results WHERE result_id = $1 AND school_id = $2",
      [id, req.user.school_id],
    );
    if (oldRecordQuery.rows.length === 0)
      return res.status(404).json({ error: "Result not found" });
    const oldRecord = oldRecordQuery.rows[0];

    const updateGrade = await pool.query(
      "UPDATE results SET test_score = $1, exam_score = $2 WHERE result_id = $3 AND school_id = $4 RETURNING *",
      [test_score, exam_score, id, req.user.school_id],
    );
    const resultData = updateGrade.rows[0];

    // Audit Log
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, target_table, record_id, old_value, new_value) VALUES ($1, 'UPDATE_GRADE', 'results', $2, $3, $4)`,
      [
        req.user.user_id,
        id,
        JSON.stringify({
          test: oldRecord.test_score,
          exam: oldRecord.exam_score,
        }),
        JSON.stringify({
          test: resultData.test_score,
          exam: resultData.exam_score,
        }),
      ],
    );

    res.json({
      message: "Grade updated successfully!",
      result: updateGrade.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
