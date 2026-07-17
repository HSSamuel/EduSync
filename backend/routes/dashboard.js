const express = require("express");
const router = express.Router();
const pool = require("../db");
const authorize = require("../middleware/authorize");
const { sendError, sendSuccess } = require("../utils/response");

// Get personal dashboard profile
router.get("/", authorize, async (req, res) => {
  try {
    const user = await pool.query(
      `
        SELECT
          u.user_id,
          u.full_name,
          u.email,
          u.role,
          u.avatar_url,
          s.school_name,
          st.class_grade,
          CASE
            WHEN u.role = 'Admin' THEN s.invite_code
            ELSE NULL
          END AS invite_code
        FROM users u
        JOIN schools s ON s.school_id = u.school_id
        LEFT JOIN students st ON st.user_id = u.user_id
        WHERE u.user_id = $1
          AND u.school_id = $2
        LIMIT 1
      `,
      [req.user.user_id, req.user.school_id],
    );

    if (user.rows.length === 0) {
      return sendError(res, {
        status: 404,
        message: "User dashboard profile not found.",
      });
    }

    const profile = {
      user_id: user.rows[0].user_id,
      full_name: user.rows[0].full_name,
      email: user.rows[0].email,
      role: user.rows[0].role,
      avatar_url: user.rows[0].avatar_url,
      school_name: user.rows[0].school_name,
      class_grade: user.rows[0].class_grade,
      invite_code: user.rows[0].invite_code,
      welcome_message: `Welcome back, ${user.rows[0].full_name}!`,
    };

    return sendSuccess(res, {
      data: profile,
      message: "Dashboard profile fetched successfully.",
    });
  } catch (err) {
    console.error("Dashboard route error:", err.message);
    return sendError(res, { status: 500, message: "Internal Server Error" });
  }
});

// Get real-time school statistics
router.get("/stats", authorize, async (req, res) => {
  try {
    // Count active users by role
    const roleCounts = await pool.query(
      `SELECT role, COUNT(*) FROM users 
       WHERE school_id = $1 AND deleted_at IS NULL 
       GROUP BY role`,
      [req.user.school_id],
    );

    const subjectsCount = await pool.query(
      "SELECT COUNT(*) FROM subjects WHERE school_id = $1",
      [req.user.school_id],
    );
    const docsCount = await pool.query(
      "SELECT COUNT(*) FROM school_documents WHERE school_id = $1",
      [req.user.school_id],
    );

    let totalStudents = 0;
    let totalTeachers = 0;
    let totalParents = 0;

    roleCounts.rows.forEach((r) => {
      if (r.role === "Student") totalStudents = parseInt(r.count, 10);
      if (r.role === "Teacher") totalTeachers = parseInt(r.count, 10);
      if (r.role === "Parent") totalParents = parseInt(r.count, 10);
    });

    return sendSuccess(res, {
      data: {
        totalStudents,
        totalTeachers,
        totalParents,
        totalSubjects: parseInt(subjectsCount.rows[0].count, 10),
        totalDocuments: parseInt(docsCount.rows[0].count, 10),
      },
    });
  } catch (err) {
    console.error("Stats route error:", err.message);
    return sendError(res, { status: 500, message: "Internal Server Error" });
  }
});

// Get live audit log activity for the sidebar
router.get("/activity", authorize, async (req, res) => {
  try {
    if (req.user.role !== "Admin") {
      return sendError(res, { status: 403, message: "Access Denied." });
    }

    const logs = await pool.query(
      `
        SELECT a.log_id, a.action, a.target_table, a.created_at, u.full_name, a.new_value
        FROM audit_logs a
        JOIN users u ON a.user_id = u.user_id
        WHERE u.school_id = $1
        ORDER BY a.created_at DESC
        LIMIT 5
      `,
      [req.user.school_id],
    );

    return sendSuccess(res, { data: logs.rows });
  } catch (err) {
    console.error("Activity route error:", err.message);
    return sendError(res, { status: 500, message: "Internal Server Error" });
  }
});

module.exports = router;
