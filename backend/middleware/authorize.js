const jwt = require('jsonwebtoken');
const { ACCESS_TOKEN_SECRET } = require('../utils/tokenConfig');
const { sendError } = require('../utils/response');

module.exports = function authorize(req, res, next) {
  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : null;

  if (!token) {
    return sendError(res, {
      status: 403,
      message: 'Access Denied. No access token provided.',
      code: 'NO_ACCESS_TOKEN',
    });
  }

  try {
    const payload = jwt.verify(token, ACCESS_TOKEN_SECRET);
    req.user = payload;
    return next();
  } catch (err) {
    return sendError(res, {
      status: 401,
      message: 'Invalid or expired token.',
      code: 'INVALID_ACCESS_TOKEN',
    });
  }
};
