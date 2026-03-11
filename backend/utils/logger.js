const crypto = require("crypto");

const LOG_LEVELS = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const configuredLevel = (
  process.env.LOG_LEVEL ||
  (process.env.NODE_ENV === "production" ? "info" : "debug")
).toLowerCase();

const minimumLevel = LOG_LEVELS[configuredLevel] || LOG_LEVELS.info;
const isProduction = process.env.NODE_ENV === "production";

function sanitizeMeta(meta = {}) {
  const clone = { ...meta };

  if (clone.headers) {
    const headers = { ...clone.headers };
    for (const key of ["authorization", "cookie", "set-cookie", "x-api-key"]) {
      if (headers[key]) headers[key] = "[REDACTED]";
    }
    clone.headers = headers;
  }

  for (const key of [
    "token",
    "refreshToken",
    "accessToken",
    "password",
    "password_hash",
    "cookie",
    "authorization",
  ]) {
    if (clone[key]) clone[key] = "[REDACTED]";
  }

  if (clone.error instanceof Error) {
    clone.error = {
      name: clone.error.name,
      message: clone.error.message,
      stack: isProduction ? undefined : clone.error.stack,
    };
  }

  return clone;
}

function shouldLog(level) {
  return (LOG_LEVELS[level] || LOG_LEVELS.info) >= minimumLevel;
}

function writeDev(level, message) {
  if (level === "error") {
    process.stderr.write(`${message}\n`);
    return;
  }
  process.stdout.write(`${message}\n`);
}

function writeProd(level, message, meta = {}) {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    service: "edusync-backend",
    env: process.env.NODE_ENV || "development",
    ...sanitizeMeta(meta),
  };

  const serialized = JSON.stringify(payload);

  if (level === "error") {
    process.stderr.write(`${serialized}\n`);
    return;
  }

  process.stdout.write(`${serialized}\n`);
}

function write(level, message, meta = {}) {
  if (!shouldLog(level)) return;

  if (isProduction) {
    writeProd(level, message, meta);
  } else {
    writeDev(level, message);
  }
}

const logger = {
  debug(message, meta) {
    write("debug", message, meta);
  },
  info(message, meta) {
    write("info", message, meta);
  },
  warn(message, meta) {
    write("warn", message, meta);
  },
  error(message, meta) {
    write("error", message, meta);
  },
};

function requestIdMiddleware(req, res, next) {
  req.requestId = req.headers["x-request-id"] || crypto.randomUUID();
  res.setHeader("X-Request-Id", req.requestId);
  next();
}

function requestLogger(req, res, next) {
  if (process.env.LOG_HTTP !== "true") {
    return next();
  }

  const startedAt = Date.now();

  res.on("finish", () => {
    logger.info(
      `HTTP ${req.method} ${req.originalUrl} ${res.statusCode} - ${Date.now() - startedAt}ms`,
    );
  });

  next();
}

module.exports = {
  logger,
  requestIdMiddleware,
  requestLogger,
};
