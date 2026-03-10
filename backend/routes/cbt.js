const express = require("express");
const router = express.Router();
const pool = require("../db");
const authorize = require("../middleware/authorize");
const { z } = require("zod");
const validate = require("../middleware/validate");
const { sendError, sendSuccess } = require("../utils/response");

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

router.post("/", authorize, validate(createQuizSchema), async (req, res, next) => {
  try {
    if (req.user.role !== "Teacher" && req.user.role !== "Admin") {
      return sendError(res, { status: 403, message: "Access Denied.", code: "FORBIDDEN" });
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

    return sendSuccess(res, {
      status: 201,
      message: "Quiz successfully created!",
      data: newQuiz.rows[0],
    });
  } catch (err) {
    return next(err);
  }
});

router.get("/", authorize, async (req, res, next) => {
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
    return sendSuccess(res, { data: quizzes.rows });
  } catch (err) {
    return next(err);
  }
});

router.get("/:id", authorize, async (req, res, next) => {
  try {
    const quiz = await pool.query(
      "SELECT * FROM quizzes WHERE quiz_id = $1 AND school_id = $2",
      [req.params.id, req.user.school_id],
    );

    if (quiz.rows.length === 0) {
      return sendError(res, { status: 404, message: "Quiz not found", code: "QUIZ_NOT_FOUND" });
    }

    if (req.user.role === "Student") {
      const sanitizedQuestions = quiz.rows[0].questions.map((q) => ({
        text: q.text,
        options: q.options,
      }));
      return sendSuccess(res, { data: { ...quiz.rows[0], questions: sanitizedQuestions } });
    }

    return sendSuccess(res, { data: quiz.rows[0] });
  } catch (err) {
    return next(err);
  }
});

router.post("/:id/submit", authorize, async (req, res, next) => {
  try {
    if (req.user.role !== "Student") {
      return sendError(res, { status: 403, message: "Only students can take quizzes.", code: "FORBIDDEN" });
    }

    const quiz_id = req.params.id;
    const { student_answers } = req.body;

    const studentQuery = await pool.query(
      "SELECT student_id FROM students WHERE user_id = $1",
      [req.user.user_id],
    );

    if (studentQuery.rows.length === 0) {
      return sendError(res, {
        status: 400,
        message: "Valid student academic record not found.",
        code: "STUDENT_RECORD_NOT_FOUND",
      });
    }
    const student_id = studentQuery.rows[0].student_id;

    const quiz = await pool.query(
      "SELECT questions FROM quizzes WHERE quiz_id = $1 AND school_id = $2",
      [quiz_id, req.user.school_id],
    );
    if (quiz.rows.length === 0) {
      return sendError(res, { status: 404, message: "Quiz not found", code: "QUIZ_NOT_FOUND" });
    }

    const realQuestions = quiz.rows[0].questions;

    if (
      !Array.isArray(student_answers) ||
      student_answers.length !== realQuestions.length
    ) {
      return sendError(res, { status: 400, message: "Invalid submission payload.", code: "INVALID_PAYLOAD" });
    }

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

    return sendSuccess(res, {
      message: "Quiz auto-graded successfully!",
      data: {
        score,
        total: realQuestions.length,
      },
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
