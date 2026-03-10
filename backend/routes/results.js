const express = require("express");
const router = express.Router();
const pool = require("../db");
const authorize = require("../middleware/authorize");
const { emailQueue } = require("../utils/emailQueue");
const { logAudit } = require("../utils/auditLogger");
const { escapeHtml } = require("../utils/html");
const { z } = require("zod");
const validate = require("../middleware/validate");
const { sendError, sendSuccess } = require("../utils/response");

const createGradeSchema = z.object({
  student_id: z.coerce.number().positive(),
  subject_id: z.coerce.number().positive(),
  academic_term: z.string().trim().min(1, "Academic term is required"),
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
      <h3 style="color: #333;">Hello ${escapeHtml(recipientName)},</h3>
      <p>An academic result for <strong>${escapeHtml(subjectName)}</strong> (${escapeHtml(term)}) has been ${isUpdate ? "updated" : "published"} to your profile.</p>
      <p>Please log in to the EduSync portal to view the updated report card and total percentages.</p>
      <p style="margin-top: 30px;">Warm regards,<br/><strong>The Administration Team</strong></p>
    </div>
  </div>
`;

async function getAccessibleSubject(subjectId, user) {
  const params = [subjectId, user.school_id];
  let query = `
    SELECT subject_id, subject_name, teacher_id, school_id
    FROM subjects
    WHERE subject_id = $1 AND school_id = $2
  `;

  if (user.role === "Teacher") {
    query += " AND teacher_id = $3";
    params.push(user.user_id);
  }

  const result = await pool.query(query, params);
  return result.rows[0] || null;
}

async function getAccessibleStudent(studentId, schoolId) {
  const result = await pool.query(
    `
      SELECT s.student_id, s.user_id, s.parent_id, s.class_grade,
             u.full_name AS student_name, u.email AS student_email, u.school_id,
             p.full_name AS parent_name, p.email AS parent_email
      FROM students s
      JOIN users u ON s.user_id = u.user_id
      LEFT JOIN users p ON s.parent_id = p.user_id
      WHERE s.student_id = $1 AND u.school_id = $2
    `,
    [studentId, schoolId],
  );

  return result.rows[0] || null;
}

async function queueGradeNotifications({ student, subjectName, academicTerm, isUpdate }) {
  const jobs = [];

  if (student.student_email) {
    jobs.push({
      name: "grade-alert",
      data: {
        to: student.student_email,
        subject: `${isUpdate ? "Updated" : "New"} Grade: ${subjectName}`,
        html: getGradeEmailHTML(
          student.student_name,
          subjectName,
          academicTerm,
          isUpdate,
        ),
      },
    });
  }

  if (student.parent_email) {
    jobs.push({
      name: "grade-alert",
      data: {
        to: student.parent_email,
        subject: `${isUpdate ? "Updated" : "New"} Grade for ${student.student_name}: ${subjectName}`,
        html: getGradeEmailHTML(
          student.parent_name || "Parent",
          subjectName,
          academicTerm,
          isUpdate,
        ),
      },
    });
  }

  if (jobs.length > 0) {
    await emailQueue.addBulk(jobs);
  }
}

async function getReadableReportCard(studentId, user) {
  const student = await getAccessibleStudent(studentId, user.school_id);
  if (!student) {
    return { status: 404, error: "Student not found in your school." };
  }

  const params = [studentId, user.school_id];
  let roleFilter = "";

  if (user.role === "Student") {
    if (student.user_id !== user.user_id) {
      return { status: 403, error: "You can only view your own report card." };
    }
  } else if (user.role === "Parent") {
    if (student.parent_id !== user.user_id) {
      return { status: 403, error: "You can only view report cards for your linked child." };
    }
  } else if (user.role === "Teacher") {
    roleFilter = " AND s.teacher_id = $3";
    params.push(user.user_id);
  } else if (user.role !== "Admin") {
    return { status: 403, error: "Access Denied." };
  }

  const reportCard = await pool.query(
    `
      SELECT r.result_id, s.subject_name, r.academic_term, r.test_score, r.exam_score, r.total_score
      FROM results r
      JOIN subjects s ON r.subject_id = s.subject_id
      WHERE r.student_id = $1 AND r.school_id = $2${roleFilter}
      ORDER BY r.academic_term DESC, s.subject_name ASC
    `,
    params,
  );

  if (user.role === "Teacher" && reportCard.rows.length === 0) {
    return {
      status: 403,
      error: "You can only view report entries for subjects assigned to you.",
    };
  }

  return { status: 200, data: reportCard.rows };
}

router.post("/", authorize, validate(createGradeSchema), async (req, res, next) => {
  const client = await pool.connect();

  try {
    if (req.user.role !== "Admin" && req.user.role !== "Teacher") {
      return sendError(res, { status: 403, message: "Access Denied.", code: "FORBIDDEN" });
    }

    const { student_id, subject_id, academic_term, test_score, exam_score } = req.body;

    const [student, subject] = await Promise.all([
      getAccessibleStudent(student_id, req.user.school_id),
      getAccessibleSubject(subject_id, req.user),
    ]);

    if (!student) {
      return sendError(res, { status: 404, message: "Student not found in your school.", code: "STUDENT_NOT_FOUND" });
    }

    if (!subject) {
      return sendError(res, { status: 404, message: "Subject not found or not assigned to you.", code: "SUBJECT_NOT_FOUND" });
    }

    await client.query("BEGIN");

    const existingResult = await client.query(
      `
        SELECT *
        FROM results
        WHERE student_id = $1
          AND subject_id = $2
          AND academic_term = $3
          AND school_id = $4
      `,
      [student_id, subject_id, academic_term, req.user.school_id],
    );

    let savedResult;
    let operation = "created";

    if (existingResult.rows.length > 0) {
      const oldRecord = existingResult.rows[0];

      const updated = await client.query(
        `
          UPDATE results
          SET test_score = $1, exam_score = $2
          WHERE result_id = $3 AND school_id = $4
          RETURNING *
        `,
        [test_score, exam_score, oldRecord.result_id, req.user.school_id],
      );

      savedResult = updated.rows[0];
      operation = "updated";

      await logAudit({
        client,
        userId: req.user.user_id,
        action: "UPSERT_GRADE_UPDATE",
        targetTable: "results",
        recordId: savedResult.result_id,
        oldValue: {
          test_score: oldRecord.test_score,
          exam_score: oldRecord.exam_score,
          total_score: oldRecord.total_score,
        },
        newValue: savedResult,
      });
    } else {
      const inserted = await client.query(
        `
          INSERT INTO results (student_id, subject_id, academic_term, test_score, exam_score, school_id)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `,
        [student_id, subject_id, academic_term, test_score, exam_score, req.user.school_id],
      );

      savedResult = inserted.rows[0];

      await logAudit({
        client,
        userId: req.user.user_id,
        action: "CREATE_GRADE",
        targetTable: "results",
        recordId: savedResult.result_id,
        newValue: savedResult,
      });
    }

    await client.query("COMMIT");

    await queueGradeNotifications({
      student,
      subjectName: subject.subject_name,
      academicTerm: academic_term,
      isUpdate: operation === "updated",
    });

    return sendSuccess(res, {
      message:
        operation === "updated"
          ? "Grade already existed for this term, so it was updated successfully."
          : "Grade saved successfully!",
      data: {
        operation,
        result: savedResult,
      },
    });
  } catch (err) {
    await client.query("ROLLBACK");
    return next(err);
  } finally {
    client.release();
  }
});

router.get("/student/:student_id", authorize, async (req, res, next) => {
  try {
    const { student_id } = req.params;
    const outcome = await getReadableReportCard(student_id, req.user);

    if (outcome.error) {
      return sendError(res, { status: outcome.status, message: outcome.error });
    }

    return sendSuccess(res, { data: outcome.data });
  } catch (err) {
    return next(err);
  }
});

router.get("/me", authorize, async (req, res, next) => {
  try {
    const myGrades = await pool.query(
      `
        SELECT r.result_id, s.subject_name, r.academic_term, r.test_score, r.exam_score, r.total_score
        FROM results r
        JOIN subjects s ON r.subject_id = s.subject_id
        JOIN students st ON r.student_id = st.student_id
        WHERE st.user_id = $1 AND r.school_id = $2
        ORDER BY r.academic_term DESC, s.subject_name ASC
      `,
      [req.user.user_id, req.user.school_id],
    );
    return sendSuccess(res, { data: myGrades.rows });
  } catch (err) {
    return next(err);
  }
});

router.put("/:id", authorize, validate(updateGradeSchema), async (req, res, next) => {
  const client = await pool.connect();

  try {
    if (req.user.role !== "Admin" && req.user.role !== "Teacher") {
      return sendError(res, { status: 403, message: "Access Denied.", code: "FORBIDDEN" });
    }

    const { id } = req.params;
    const { test_score, exam_score } = req.body;

    const oldRecordQuery = await client.query(
      `
        SELECT r.*, sub.subject_name
        FROM results r
        JOIN subjects sub ON r.subject_id = sub.subject_id
        WHERE r.result_id = $1 AND r.school_id = $2
      `,
      [id, req.user.school_id],
    );

    if (oldRecordQuery.rows.length === 0) {
      return sendError(res, { status: 404, message: "Result not found", code: "RESULT_NOT_FOUND" });
    }

    const oldRecord = oldRecordQuery.rows[0];

    if (req.user.role === "Teacher") {
      const subject = await getAccessibleSubject(oldRecord.subject_id, req.user);
      if (!subject) {
        return sendError(res, {
          status: 403,
          message: "You can only update grades for your assigned subjects.",
          code: "FORBIDDEN",
        });
      }
    }

    await client.query("BEGIN");

    const updateGrade = await client.query(
      `
        UPDATE results
        SET test_score = $1, exam_score = $2
        WHERE result_id = $3 AND school_id = $4
        RETURNING *
      `,
      [test_score, exam_score, id, req.user.school_id],
    );

    const resultData = updateGrade.rows[0];

    await logAudit({
      client,
      userId: req.user.user_id,
      action: "UPDATE_GRADE",
      targetTable: "results",
      recordId: Number(id),
      oldValue: {
        test_score: oldRecord.test_score,
        exam_score: oldRecord.exam_score,
        total_score: oldRecord.total_score,
      },
      newValue: {
        test_score: resultData.test_score,
        exam_score: resultData.exam_score,
        total_score: resultData.total_score,
      },
    });

    await client.query("COMMIT");

    const student = await getAccessibleStudent(oldRecord.student_id, req.user.school_id);
    if (student) {
      await queueGradeNotifications({
        student,
        subjectName: oldRecord.subject_name,
        academicTerm: oldRecord.academic_term,
        isUpdate: true,
      });
    }

    return sendSuccess(res, {
      message: "Grade updated successfully!",
      data: {
        result: resultData,
      },
    });
  } catch (err) {
    await client.query("ROLLBACK");
    return next(err);
  } finally {
    client.release();
  }
});

module.exports = router;
