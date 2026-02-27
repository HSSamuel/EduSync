const express = require("express");
const router = express.Router();
const pool = require("../db");
const authorize = require("../middleware/authorize");
const sendEmail = require("../utils/sendEmail"); // 👈 NEW: Import Email Engine

// Helper Function: The Email Template for Grades
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

// 1. ADD A STUDENT'S GRADE & TRIGGER EMAIL
router.post("/", authorize, async (req, res) => {
  try {
    if (req.user.role !== "Admin" && req.user.role !== "Teacher") {
      return res
        .status(403)
        .json({
          error: "Access Denied. Only Admins and Teachers can add grades.",
        });
    }

    const { student_id, subject_id, academic_term, test_score, exam_score } =
      req.body;

    const newResult = await pool.query(
      "INSERT INTO results (student_id, subject_id, academic_term, test_score, exam_score) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [student_id, subject_id, academic_term, test_score, exam_score],
    );

    // --- NEW: AUTOMATED EMAIL TRIGGER ---
    const detailsQuery = await pool.query(
      `
      SELECT 
        u.email AS student_email, u.full_name AS student_name,
        p.email AS parent_email, p.full_name AS parent_name,
        sub.subject_name
      FROM students s
      JOIN users u ON s.user_id = u.user_id
      LEFT JOIN users p ON s.parent_id = p.user_id
      JOIN subjects sub ON sub.subject_id = $1
      WHERE s.student_id = $2
    `,
      [subject_id, student_id],
    );

    if (detailsQuery.rows.length > 0) {
      const details = detailsQuery.rows[0];

      // Notify Student
      if (details.student_email) {
        sendEmail({
          to: details.student_email,
          subject: `New Grade: ${details.subject_name}`,
          html: getGradeEmailHTML(
            details.student_name,
            details.subject_name,
            academic_term,
          ),
        });
      }
      // Notify Parent (If linked)
      if (details.parent_email) {
        sendEmail({
          to: details.parent_email,
          subject: `New Grade for ${details.student_name}: ${details.subject_name}`,
          html: getGradeEmailHTML(
            details.parent_name,
            details.subject_name,
            academic_term,
          ),
        });
      }
    }
    // ------------------------------------

    res.json(newResult.rows[0]);
  } catch (err) {
    console.error(err.message);
    res
      .status(500)
      .send(
        "Server Error. (Check if the student_id and subject_id actually exist!)",
      );
  }
});

// 2. GET A SPECIFIC STUDENT'S REPORT CARD
router.get("/student/:student_id", authorize, async (req, res) => {
  try {
    const { student_id } = req.params;
    const reportCard = await pool.query(
      `
      SELECT results.result_id, subjects.subject_name, results.academic_term, results.test_score, results.exam_score, results.total_score
      FROM results JOIN subjects ON results.subject_id = subjects.subject_id WHERE results.student_id = $1
    `,
      [student_id],
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
      SELECT results.result_id, subjects.subject_name, results.academic_term, results.test_score, results.exam_score, results.total_score
      FROM results JOIN subjects ON results.subject_id = subjects.subject_id JOIN students ON results.student_id = students.student_id
      WHERE students.user_id = $1
    `,
      [req.user.user_id],
    );
    res.json(myGrades.rows);
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

// 4. UPDATE A GRADE & TRIGGER EMAIL
router.put("/:id", authorize, async (req, res) => {
  try {
    if (req.user.role !== "Admin" && req.user.role !== "Teacher") {
      return res.status(403).json({ error: "Access Denied." });
    }

    const { id } = req.params;
    const { test_score, exam_score } = req.body;

    const updateGrade = await pool.query(
      "UPDATE results SET test_score = $1, exam_score = $2 WHERE result_id = $3 RETURNING *",
      [test_score, exam_score, id],
    );

    // --- NEW: AUTOMATED UPDATE EMAIL TRIGGER ---
    const resultData = updateGrade.rows[0];
    const detailsQuery = await pool.query(
      `
      SELECT u.email AS student_email, u.full_name AS student_name, p.email AS parent_email, p.full_name AS parent_name, sub.subject_name
      FROM students s
      JOIN users u ON s.user_id = u.user_id
      LEFT JOIN users p ON s.parent_id = p.user_id
      JOIN subjects sub ON sub.subject_id = $1
      WHERE s.student_id = $2
    `,
      [resultData.subject_id, resultData.student_id],
    );

    if (detailsQuery.rows.length > 0) {
      const details = detailsQuery.rows[0];
      if (details.student_email)
        sendEmail({
          to: details.student_email,
          subject: `Grade Updated: ${details.subject_name}`,
          html: getGradeEmailHTML(
            details.student_name,
            details.subject_name,
            resultData.academic_term,
            true,
          ),
        });
      if (details.parent_email)
        sendEmail({
          to: details.parent_email,
          subject: `Grade Updated for ${details.student_name}: ${details.subject_name}`,
          html: getGradeEmailHTML(
            details.parent_name,
            details.subject_name,
            resultData.academic_term,
            true,
          ),
        });
    }
    // ------------------------------------

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
