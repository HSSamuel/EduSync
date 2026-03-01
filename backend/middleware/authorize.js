const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = function (req, res, next) {
  // Note: Since we implemented cookies in Phase 1, we check headers OR cookies
  const token = req.header("jwt_token") || req.cookies?.access_token;

  if (!token) {
    return res
      .status(403)
      .json({ error: "Access Denied. No VIP pass provided!" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Payload now contains: { user_id, role, school_id }
    req.user = payload;

    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token." });
  }
};
