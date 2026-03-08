const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET } = require('./tokenConfig');

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '7d';
const REFRESH_COOKIE_NAME = 'refresh_token';
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function createAccessToken({ user_id, role, school_id }) {
  return jwt.sign({ user_id, role, school_id }, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL,
  });
}

function createRefreshToken({ user_id, school_id, session_id, token_version }) {
  return jwt.sign(
    { user_id, school_id, session_id, token_version },
    REFRESH_TOKEN_SECRET,
    { expiresIn: REFRESH_TOKEN_TTL },
  );
}

function setRefreshCookie(res, refreshToken) {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: REFRESH_COOKIE_MAX_AGE,
    path: '/',
  });
}

function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

function getRequestMetadata(req) {
  return {
    ip_address: req.ip || req.headers['x-forwarded-for'] || null,
    user_agent: req.get('user-agent') || 'unknown',
  };
}

async function createSession({ pool, user, req }) {
  const metadata = getRequestMetadata(req);

  const sessionResult = await pool.query(
    `
      INSERT INTO user_sessions (user_id, school_id, user_agent, ip_address, refresh_token_hash, token_version, expires_at)
      VALUES ($1, $2, $3, $4, '', 1, NOW() + INTERVAL '7 days')
      RETURNING session_id, token_version
    `,
    [user.user_id, user.school_id, metadata.user_agent, metadata.ip_address],
  );

  const session = sessionResult.rows[0];
  const refreshToken = createRefreshToken({
    user_id: user.user_id,
    school_id: user.school_id,
    session_id: session.session_id,
    token_version: session.token_version,
  });

  await pool.query(
    `
      UPDATE user_sessions
      SET refresh_token_hash = $1, last_seen_at = NOW(), expires_at = NOW() + INTERVAL '7 days'
      WHERE session_id = $2
    `,
    [hashToken(refreshToken), session.session_id],
  );

  return {
    accessToken: createAccessToken(user),
    refreshToken,
    sessionId: session.session_id,
  };
}

async function rotateSession({ pool, refreshToken, req }) {
  const payload = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);

  const sessionResult = await pool.query(
    `
      SELECT session_id, user_id, school_id, token_version, revoked_at, expires_at, refresh_token_hash
      FROM user_sessions
      WHERE session_id = $1
    `,
    [payload.session_id],
  );

  if (sessionResult.rows.length === 0) {
    const error = new Error('Session not found.');
    error.status = 401;
    throw error;
  }

  const session = sessionResult.rows[0];
  const hashedToken = hashToken(refreshToken);

  if (
    session.revoked_at ||
    session.refresh_token_hash !== hashedToken ||
    Number(session.token_version) !== Number(payload.token_version) ||
    new Date(session.expires_at).getTime() <= Date.now()
  ) {
    await pool.query(
      'UPDATE user_sessions SET revoked_at = COALESCE(revoked_at, NOW()) WHERE session_id = $1',
      [session.session_id],
    );
    const error = new Error('Invalid refresh token.');
    error.status = 401;
    throw error;
  }

  const userResult = await pool.query(
    'SELECT user_id, role, school_id FROM users WHERE user_id = $1',
    [payload.user_id],
  );

  if (userResult.rows.length === 0) {
    await pool.query('UPDATE user_sessions SET revoked_at = NOW() WHERE session_id = $1', [
      session.session_id,
    ]);
    const error = new Error('User no longer exists.');
    error.status = 401;
    throw error;
  }

  const user = userResult.rows[0];
  const metadata = getRequestMetadata(req);
  const nextTokenVersion = Number(session.token_version) + 1;
  const nextRefreshToken = createRefreshToken({
    user_id: user.user_id,
    school_id: user.school_id,
    session_id: session.session_id,
    token_version: nextTokenVersion,
  });

  await pool.query(
    `
      UPDATE user_sessions
      SET token_version = $1,
          refresh_token_hash = $2,
          last_seen_at = NOW(),
          user_agent = $3,
          ip_address = $4,
          expires_at = NOW() + INTERVAL '7 days'
      WHERE session_id = $5
    `,
    [nextTokenVersion, hashToken(nextRefreshToken), metadata.user_agent, metadata.ip_address, session.session_id],
  );

  return {
    accessToken: createAccessToken(user),
    refreshToken: nextRefreshToken,
    user,
  };
}

async function revokeSessionByToken({ pool, refreshToken }) {
  if (!refreshToken) return false;

  try {
    const payload = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    await pool.query('UPDATE user_sessions SET revoked_at = NOW() WHERE session_id = $1', [
      payload.session_id,
    ]);
    return true;
  } catch {
    return false;
  }
}

async function revokeAllUserSessions({ pool, userId }) {
  await pool.query('UPDATE user_sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL', [
    userId,
  ]);
}

module.exports = {
  REFRESH_COOKIE_NAME,
  hashToken,
  createSession,
  rotateSession,
  revokeSessionByToken,
  revokeAllUserSessions,
  setRefreshCookie,
  clearRefreshCookie,
  createAccessToken,
};
