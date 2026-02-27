const express = require("express");
const router = express.Router();
const pool = require("../db");
const authorize = require("../middleware/authorize");

// 1. CREATE A QUIZ (Teacher/Admin Only)
router.post("/", authorize, async (req, res) => {
  try {
    if (req.user.role !== "Teacher" && req.user.role !== "Admin") {
      return res.status(403).json({ error: "Access Denied." });
    }

    const { subject_id, title, questions } = req.body;
    // 'questions' is an array of objects: [{ text: "", options: ["A", "B", "C", "D"], answer: 0 }]

    const newQuiz = await pool.query(
      "INSERT INTO quizzes (subject_id, title, questions, created_by) VALUES ($1, $2, $3, $4) RETURNING *",
      [subject_id, title, JSON.stringify(questions), req.user.user_id]
    );

    res.json({ message: "Quiz successfully created!", quiz: newQuiz.rows[0] });
  } catch (err) {
    console.error(err.message); res.status(500).send("Server Error");
  }
});

// 2. GET ALL QUIZZES
router.get("/", authorize, async (req, res) => {
  try {
    const quizzes = await pool.query(`
      SELECT q.quiz_id, q.title, q.created_at, s.subject_name 
      FROM quizzes q
      JOIN subjects s ON q.subject_id = s.subject_id
      ORDER BY q.created_at DESC
    `);
    res.json(quizzes.rows);
  } catch (err) {
    console.error(err.message); res.status(500).send("Server Error");
  }
});

// 3. GET A SPECIFIC QUIZ (To take it)
router.get("/:id", authorize, async (req, res) => {
  try {
    const quiz = await pool.query("SELECT * FROM quizzes WHERE quiz_id = $1", [req.params.id]);
    
    // Security: If the user is a Student, do NOT send the correct answers to the frontend!
    if (req.user.role === "Student") {
      const sanitizedQuestions = quiz.rows[0].questions.map(q => ({ text: q.text, options: q.options }));
      return res.json({ ...quiz.rows[0], questions: sanitizedQuestions });
    }
    
    res.json(quiz.rows[0]);
  } catch (err) {
    console.error(err.message); res.status(500).send("Server Error");
  }
});

// 4. AUTO-GRADE A QUIZ SUBMISSION (Student Only)
router.post("/:id/submit", authorize, async (req, res) => {
  try {
    if (req.user.role !== "Student") return res.status(403).json({ error: "Only students can take quizzes." });

    const quiz_id = req.params.id;
    const { student_answers } = req.body; // Array of selected option indexes

    // Get the student's actual ID
    const studentQuery = await pool.query("SELECT student_id FROM students WHERE user_id = $1", [req.user.user_id]);
    const student_id = studentQuery.rows[0].student_id;

    // Fetch the quiz with the REAL answers
    const quiz = await pool.query("SELECT questions FROM quizzes WHERE quiz_id = $1", [quiz_id]);
    const realQuestions = quiz.rows[0].questions;

    // The Auto-Grading Engine!
    let score = 0;
    for (let i = 0; i < realQuestions.length; i++) {
      if (student_answers[i] === realQuestions[i].answer) {
        score++;
      }
    }

    // Save the result
    await pool.query(
      "INSERT INTO cbt_results (quiz_id, student_id, score, total_questions) VALUES ($1, $2, $3, $4)",
      [quiz_id, student_id, score, realQuestions.length]
    );

    res.json({ message: "Quiz auto-graded successfully!", score, total: realQuestions.length });
  } catch (err) {
    console.error(err.message); res.status(500).send("Server Error");
  }
});

module.exports = router;