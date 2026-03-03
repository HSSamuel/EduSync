const express = require("express");
const router = express.Router();
const pool = require("../db");
const authorize = require("../middleware/authorize");

// GET chat history for a specific room
router.get("/history/:room", authorize, async (req, res, next) => {
  try {
    const { room } = req.params;
    const history = await pool.query(
      "SELECT message_id as id, room, message, sender_name as sender, sender_role as role, sent_at as time FROM messages WHERE room = $1 AND school_id = $2 ORDER BY sent_at ASC LIMIT 100",
      [room, req.user.school_id]
    );

    // Format the timestamp for the frontend
    const formattedHistory = history.rows.map(msg => ({
      ...msg,
      time: new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));

    res.json(formattedHistory);
  } catch (err) {
    next(err);
  }
});

module.exports = router;