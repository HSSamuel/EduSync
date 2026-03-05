const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = function (req, res, next) {
  // 👈 FIX: Check standard Authorization Bearer header first, fallback to jwt_token or cookie
  let token = req.cookies?.access_token || req.header("jwt_token");
  
  const authHeader = req.header("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  if (!token) {
    return res
      .status(403)
      .json({ error: "Access Denied. No VIP pass provided!" });
  }

  try {
    const payload = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET,
    );

    // Payload now contains: { user_id, role, school_id }
    req.user = payload;

    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token." });
  }
};