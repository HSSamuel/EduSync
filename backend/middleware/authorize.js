const jwt = require("jsonwebtoken");
require("dotenv").config();

// This is the middleware function (The Bouncer)
module.exports = function (req, res, next) {
  // 1. Get the token from the request header
  const token = req.header("jwt_token");

  // 2. Check if no token exists
  if (!token) {
    return res
      .status(403)
      .json({ error: "Access Denied. No VIP pass provided!" });
  }

  // 3. Verify the token is real and hasn't been tampered with
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Attach the user's data (like user_id and role) to the request
    req.user = payload;

    // 5. Pass the baton to the next piece of code (let them in!)
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token." });
  }
};
