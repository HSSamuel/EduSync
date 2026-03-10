const express = require("express");
const router = express.Router();
const pool = require("../db");
const authorize = require("../middleware/authorize");
const { sendError, sendSuccess } = require("../utils/response");

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
          CASE
            WHEN u.role = 'Admin' THEN s.invite_code
            ELSE NULL
          END AS invite_code
        FROM users u
        JOIN schools s ON s.school_id = u.school_id
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
      invite_code: user.rows[0].invite_code,
      welcome_message: `Welcome back, ${user.rows[0].full_name}!`,
    };

    return sendSuccess(res, {
      data: profile,
      message: "Dashboard profile fetched successfully.",
    });
  } catch (err) {
    console.error("Dashboard route error:", err.message);
    return sendError(res, {
      status: 500,
      message: "Internal Server Error",
    });
  }
});

module.exports = router;
