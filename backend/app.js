const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
require("dotenv").config();
const { sendError, sendSuccess } = require("./utils/response");
const { getServiceHealthSummary } = require("./utils/healthCheck");

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || CLIENT_URL)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function createApp() {
  const app = express();

  const corsOptions = {
    origin(origin, callback) {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
  };

  app.disable("x-powered-by");
  app.set("trust proxy", process.env.TRUST_PROXY || "loopback");
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=()",
    );
    next();
  });

  app.use(cors(corsOptions));
  app.use("/api/finance/webhook", express.raw({ type: "application/json" }));
  app.use((req, res, next) => {
    if (req.originalUrl === "/api/finance/webhook") {
      next();
    } else {
      express.json({ limit: "10mb" })(req, res, next);
    }
  });
  app.use(cookieParser());

  app.get("/", (req, res) => {
    res.send("Welcome to the EduSync API! The server is alive.");
  });

  app.get("/api/health", async (req, res, next) => {
    try {
      const summary = await getServiceHealthSummary();
      const status = summary.status === "fail" ? 503 : 200;
      return sendSuccess(res, {
        status,
        message:
          summary.status === "ok"
            ? "All monitored services are healthy."
            : "Service health check completed.",
        data: summary,
      });
    } catch (error) {
      return next(error);
    }
  });

  app.use("/api/auth", require("./routes/auth"));
  app.use("/api/dashboard", require("./routes/dashboard"));
  app.use("/api/subjects", require("./routes/subjects"));
  app.use("/api/students", require("./routes/students"));
  app.use("/api/modules", require("./routes/modules"));
  app.use("/api/users", require("./routes/users"));
  app.use("/api/attendance", require("./routes/attendance"));
  app.use("/api/cbt", require("./routes/cbt"));
  app.use("/api/timetable", require("./routes/timetable"));
  app.use("/api/chat", require("./routes/chat"));
  app.use("/api/results", require("./routes/results"));
  app.use("/api/school", require("./routes/school"));
  app.use("/api/finance", require("./routes/finance"));

  app.use((err, req, res, next) => {
    console.error("🔥 Global Error Handler Caught:", err.message);

    if (err.name === "MulterError") {
      return sendError(res, {
        status: 400,
        message: "File upload error occurred.",
      });
    }

    if (err.message === "Origin not allowed by CORS") {
      return sendError(res, { status: 403, message: "Origin not allowed." });
    }

    return sendError(res, {
      status: err.status || 500,
      message:
        process.env.NODE_ENV === "development"
          ? err.message
          : "Internal Server Error",
    });
  });

  return app;
}

module.exports = createApp;
