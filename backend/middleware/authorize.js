const jwt = require('jsonwebtoken');
const { ACCESS_TOKEN_SECRET } = require('../utils/tokenConfig');
const { sendError } = require('../utils/response');

module.exports = function authorize(req, res, next) {
  let token = null;

  const authHeader = req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (req.header('jwt_token')) {
    token = req.header('jwt_token');
  } else if (req.cookies?.access_token) {
    token = req.cookies.access_token;
  }

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
    next();
  } catch (err) {
    return sendError(res, {
      status: 401,
      message: 'Invalid or expired token.',
      code: 'INVALID_ACCESS_TOKEN',
    });
  }
};
