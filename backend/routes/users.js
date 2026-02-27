const express = require("express");
const router = express.Router();
const pool = require("../db");
const authorize = require("../middleware/authorize");

// 1. GET ALL TEACHERS (For the Admin dropdown)
router.get("/teachers", authorize, async (req, res) => {
  try {
    const teachers = await pool.query(
      "SELECT user_id, full_name, email FROM users WHERE role = 'Teacher'"
    );
    res.json(teachers.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// 2. GET ALL PARENTS (For the Admin dropdown)
router.get("/parents", authorize, async (req, res) => {
  try {
    const parents = await pool.query(
      "SELECT user_id, full_name, email FROM users WHERE role = 'Parent'"
    );
    res.json(parents.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;