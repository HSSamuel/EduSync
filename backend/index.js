const express = require("express");
const cors = require("cors");
const pool = require("./db");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const { ACCESS_TOKEN_SECRET } = require("./utils/tokenConfig");
require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || CLIENT_URL)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const server = http.createServer(app);

const ROOM_NAME_REGEX = /^[a-zA-Z0-9 _-]{1,64}$/;
const MAX_CHAT_MESSAGE_LENGTH = 2000;

const isValidRoomName = (room) => typeof room === "string" && ROOM_NAME_REGEX.test(room.trim());
const isValidMessage = (message) =>
  typeof message === "string" && message.trim().length > 0 && message.trim().length <= MAX_CHAT_MESSAGE_LENGTH;

const corsOptions = {
  origin(origin, callback) {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Origin not allowed by CORS"));
  },
  credentials: true,
};

const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.disable("x-powered-by");
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
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

app.use("/api/auth", require("./routes/auth"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/subjects", require("./routes/subjects"));
app.use("/api/students", require("./routes/students"));
app.use("/api/modules", require("./routes/modules"));
app.use("/api/results", require("./routes/results"));
app.use("/api/users", require("./routes/users"));
app.use("/api/school", require("./routes/school"));
app.use("/api/attendance", require("./routes/attendance"));
app.use("/api/finance", require("./routes/finance"));
app.use("/api/cbt", require("./routes/cbt"));
app.use("/api/timetable", require("./routes/timetable"));
app.use("/api/chat", require("./routes/chat"));

app.use((err, req, res, next) => {
  console.error("🔥 Global Error Handler Caught:", err.message);

  if (err.name === "MulterError") {
    return res.status(400).json({ error: "File upload error occurred." });
  }

  if (err.message === "Origin not allowed by CORS") {
    return res.status(403).json({ error: "Origin not allowed." });
  }

  res.status(err.status || 500).json({
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal Server Error",
  });
});

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    const payload = jwt.verify(token, ACCESS_TOKEN_SECRET);

    const userQuery = await pool.query(
      "SELECT full_name, role FROM users WHERE user_id = $1",
      [payload.user_id],
    );
    if (userQuery.rows.length === 0) return next(new Error("User not found"));

    socket.user = {
      id: payload.user_id,
      name: userQuery.rows[0].full_name,
      role: userQuery.rows[0].role,
      school_id: payload.school_id,
    };
    next();
  } catch (err) {
    next(new Error("Authentication error: Invalid token"));
  }
});

io.on("connection", (socket) => {
  console.log(`🟢 User Connected: ${socket.user.name} (${socket.id})`);

  socket.on("join_room", (room) => {
    if (!isValidRoomName(room)) {
      socket.emit("chat_error", { error: "Invalid room name." });
      return;
    }

    const normalizedRoom = room.trim();
    const secureRoom = `${socket.user.school_id}_${normalizedRoom}`;
    socket.join(secureRoom);
    console.log(`User ${socket.user.name} joined room: ${secureRoom}`);
  });

  socket.on("send_message", async (data = {}) => {
    const room = data.room;
    const rawMessage = data.message;

    if (!isValidRoomName(room)) {
      socket.emit("chat_error", { error: "Invalid room name." });
      return;
    }

    if (!isValidMessage(rawMessage)) {
      socket.emit("chat_error", {
        error: `Message must be between 1 and ${MAX_CHAT_MESSAGE_LENGTH} characters.`,
      });
      return;
    }

    const normalizedMessage = rawMessage.trim();
    const normalizedRoom = room.trim();
    const secureRoom = `${socket.user.school_id}_${normalizedRoom}`;

    try {
      const result = await pool.query(
        `
          INSERT INTO messages (room, message, sender_name, sender_role, sender_user_id, school_id)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING message_id, sent_at
        `,
        [
          normalizedRoom,
          normalizedMessage,
          socket.user.name,
          socket.user.role,
          socket.user.id,
          socket.user.school_id,
        ],
      );

      const persistedMessage = result.rows[0];
      const secureMessage = {
        id: persistedMessage.message_id,
        room: normalizedRoom,
        message: normalizedMessage,
        time: persistedMessage.sent_at,
        sender: socket.user.name,
        role: socket.user.role,
        sender_user_id: socket.user.id,
      };

      io.to(secureRoom).emit("receive_message", secureMessage);
    } catch (err) {
      console.error("❌ Chat persistence error:", err.message);
      socket.emit("chat_error", { error: "Unable to send message right now." });
    }
  });

  socket.on("disconnect", () => {
    console.log(`🔴 User Disconnected: ${socket.user.name} (${socket.id})`);
  });
});

pool
  .connect()
  .then(() => {
    console.log("📦 Successfully connected to the PostgreSQL Database!");

    server.listen(PORT, () => {
      console.log(
        `🚀 Server & WebSockets are officially running on port ${PORT}`,
      );
    });
  })
  .catch((err) => {
    console.error("❌ Database connection error:", err.stack);
  });
