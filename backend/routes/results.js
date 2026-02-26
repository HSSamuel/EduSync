const express = require("express");
const router = express.Router();
const pool = require("../db");
const authorize = require("../middleware/authorize");

// 1. ADD A STUDENT'S GRADE (Admin only for now)
router.post("/", authorize, async (req, res) => {
  try {
    if (req.user.role !== "Admin") {
      return res
        .status(403)
        .json({ error: "Access Denied. Only Admins can add grades." });
    }

    const { student_id, subject_id, academic_term, test_score, exam_score } =
      req.body;

    // Notice we don't insert total_score. The database calculates it automatically!
    const newResult = await pool.query(
      "INSERT INTO results (student_id, subject_id, academic_term, test_score, exam_score) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [student_id, subject_id, academic_term, test_score, exam_score],
    );

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

    // We use a JOIN to fetch the human-readable subject name instead of just an ID
    const reportCard = await pool.query(
      `
      SELECT 
        results.result_id, 
        subjects.subject_name, 
        results.academic_term, 
        results.test_score, 
        results.exam_score, 
        results.total_score
      FROM results
      JOIN subjects ON results.subject_id = subjects.subject_id
      WHERE results.student_id = $1
    `,
      [student_id],
    );

    res.json(reportCard.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// 3. GET A LOGGED-IN STUDENT'S OWN GRADES
router.get("/me", authorize, async (req, res) => {
  try {
    // We use the user_id from the token, look up their student_id, and grab their grades!
    const myGrades = await pool.query(`
      SELECT 
        results.result_id, 
        subjects.subject_name, 
        results.academic_term, 
        results.test_score, 
        results.exam_score, 
        results.total_score
      FROM results
      JOIN subjects ON results.subject_id = subjects.subject_id
      JOIN students ON results.student_id = students.student_id
      WHERE students.user_id = $1
    `, [req.user.user_id]);

    res.json(myGrades.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// 4. UPDATE A GRADE (Admin only)
router.put("/:id", authorize, async (req, res) => {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({ error: "Access Denied. Only Admins can update grades." });
    }

    const { id } = req.params; // The ID of the specific result row
    const { test_score, exam_score } = req.body;

    // We update the scores, and the database automatically recalculates the total_score!
    const updateGrade = await pool.query(
      "UPDATE results SET test_score = $1, exam_score = $2 WHERE result_id = $3 RETURNING *",
      [test_score, exam_score, id]
    );

    res.json({ message: "Grade updated successfully!", result: updateGrade.rows[0] });

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
