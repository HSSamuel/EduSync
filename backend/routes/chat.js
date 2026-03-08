const express = require("express");
const router = express.Router();
const pool = require("../db");
const authorize = require("../middleware/authorize");

router.get("/history/:room", authorize, async (req, res, next) => {
  try {
    const { room } = req.params;
    const history = await pool.query(
      `
        SELECT message_id as id, room, message, sender_name as sender, sender_role as role,
               sender_user_id, sent_at as time
        FROM messages
        WHERE room = $1 AND school_id = $2
        ORDER BY sent_at ASC
        LIMIT 100
      `,
      [room, req.user.school_id],
    );

    const formattedHistory = history.rows.map((msg) => ({
      ...msg,
      time: new Date(msg.time).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }));

    res.json(formattedHistory);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
