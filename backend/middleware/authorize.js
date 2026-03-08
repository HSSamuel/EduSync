const jwt = require("jsonwebtoken");
const { ACCESS_TOKEN_SECRET } = require("../utils/tokenConfig");

module.exports = function authorize(req, res, next) {
  let token = null;

  const authHeader = req.header("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.slice(7).trim();
  } else if (req.header("jwt_token")) {
    token = req.header("jwt_token");
  } else if (req.cookies?.access_token) {
    token = req.cookies.access_token;
  }

  if (!token) {
    return res.status(403).json({ error: "Access Denied. No access token provided." });
  }

  try {
    const payload = jwt.verify(token, ACCESS_TOKEN_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
};
