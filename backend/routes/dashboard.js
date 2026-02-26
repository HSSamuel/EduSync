const express = require("express");
const router = express.Router();
const authorize = require("../middleware/authorize");

// 1. GET DASHBOARD DATA (Located at /api/dashboard/)
router.get("/", authorize, async (req, res) => {
  try {
    res.json({
      message: "Welcome to the secure Admin Vault!",
      your_user_id: req.user.user_id,
      your_role: req.user.role,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
