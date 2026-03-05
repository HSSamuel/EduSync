const express = require("express");
const router = express.Router();
const pool = require("../db");
const authorize = require("../middleware/authorize");
const { z } = require("zod");
const validate = require("../middleware/validate");

const createQuizSchema = z.object({
  subject_id: z.coerce.number().positive(),
  title: z.string().min(3, "Title must be at least 3 characters"),
  questions: z
    .array(
      z.object({
        text: z.string().min(1, "Question text is required"),
        options: z.array(z.string()).length(4, "Exactly 4 options required"),
        answer: z.number().min(0).max(3, "Answer must be index 0-3"),
      }),
    )
    .min(1, "At least one question is required"),
});

// 1. CREATE A QUIZ (Teacher/Admin Only)
router.post("/", authorize, validate(createQuizSchema), async (req, res) => {
  try {
    if (req.user.role !== "Teacher" && req.user.role !== "Admin") {
      return res.status(403).json({ error: "Access Denied." });
    }

    const { subject_id, title, questions } = req.body;

    const newQuiz = await pool.query(
      "INSERT INTO quizzes (subject_id, title, questions, created_by, school_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [
        subject_id,
        title,
        JSON.stringify(questions),
        req.user.user_id,
        req.user.school_id,
      ],
    );

    res.json({ message: "Quiz successfully created!", quiz: newQuiz.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 2. GET ALL QUIZZES
router.get("/", authorize, async (req, res) => {
  try {
    const quizzes = await pool.query(
      `
      SELECT q.quiz_id, q.title, q.created_at, s.subject_name 
      FROM quizzes q
      JOIN subjects s ON q.subject_id = s.subject_id
      WHERE q.school_id = $1
      ORDER BY q.created_at DESC
    `,
      [req.user.school_id],
    );
    res.json(quizzes.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 3. GET A SPECIFIC QUIZ (To take it)
router.get("/:id", authorize, async (req, res) => {
  try {
    const quiz = await pool.query(
      "SELECT * FROM quizzes WHERE quiz_id = $1 AND school_id = $2",
      [req.params.id, req.user.school_id],
    );

    if (quiz.rows.length === 0)
      return res.status(404).json({ error: "Quiz not found" });

    // Security: If the user is a Student, do NOT send the correct answers to the frontend!
    if (req.user.role === "Student") {
      const sanitizedQuestions = quiz.rows[0].questions.map((q) => ({
        text: q.text,
        options: q.options,
      }));
      return res.json({ ...quiz.rows[0], questions: sanitizedQuestions });
    }

    res.json(quiz.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 4. AUTO-GRADE A QUIZ SUBMISSION (Student Only)
router.post("/:id/submit", authorize, async (req, res) => {
  try {
    if (req.user.role !== "Student")
      return res.status(403).json({ error: "Only students can take quizzes." });

    const quiz_id = req.params.id;
    const { student_answers } = req.body;

    const studentQuery = await pool.query(
      "SELECT student_id FROM students WHERE user_id = $1",
      [req.user.user_id],
    );
    
    // 👈 FIX: Prevent fatal crash if student record is somehow missing
    if (studentQuery.rows.length === 0) {
      return res.status(400).json({ error: "Valid student academic record not found." });
    }
    const student_id = studentQuery.rows[0].student_id;

    const quiz = await pool.query(
      "SELECT questions FROM quizzes WHERE quiz_id = $1 AND school_id = $2",
      [quiz_id, req.user.school_id],
    );
    if (quiz.rows.length === 0)
      return res.status(404).json({ error: "Quiz not found" });

    const realQuestions = quiz.rows[0].questions;

    // Security Fix - Prevent array out-of-bounds manipulation
    if (
      !Array.isArray(student_answers) ||
      student_answers.length !== realQuestions.length
    ) {
      return res.status(400).json({ error: "Invalid submission payload." });
    }

    // The Auto-Grading Engine
    let score = 0;
    for (let i = 0; i < realQuestions.length; i++) {
      if (student_answers[i] === realQuestions[i].answer) {
        score++;
      }
    }

    await pool.query(
      "INSERT INTO cbt_results (quiz_id, student_id, score, total_questions) VALUES ($1, $2, $3, $4)",
      [quiz_id, student_id, score, realQuestions.length],
    );

    res.json({
      message: "Quiz auto-graded successfully!",
      score,
      total: realQuestions.length,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;