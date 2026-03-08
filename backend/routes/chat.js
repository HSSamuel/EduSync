const express = require("express");
const router = express.Router();
const pool = require("../db");
const authorize = require("../middleware/authorize");
const { sendSuccess } = require("../utils/response");

router.get("/history/:room", authorize, async (req, res, next) => {
  try {
    const { room } = req.params;
    const schoolId = req.user?.school_id;

    if (!schoolId) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Missing school context.",
      });
    }

    const normalizedRoom = room.trim();

    const history = await pool.query(
      `
        SELECT
          message_id AS id,
          room,
          message,
          sender_name AS sender,
          sender_role AS role,
          sent_at AS time
        FROM messages
        WHERE room = $1 AND school_id = $2
        ORDER BY sent_at ASC
        LIMIT 100
      `,
      [normalizedRoom, schoolId],
    );

    const formattedHistory = history.rows.map((msg) => ({
      ...msg,
      time: msg.time
        ? new Date(msg.time).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "--:--",
    }));

    return sendSuccess(res, { data: formattedHistory });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
