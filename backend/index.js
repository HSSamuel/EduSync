const express = require("express");
const cors = require("cors");
const pool = require("./db");
const path = require("path");
const cookieParser = require("cookie-parser");
const authorize = require("./middleware/authorize");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  }),
);

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

// ==========================================
// WEBSOCKET (SOCKET.IO) ENGINE
// ==========================================
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token)
      return next(new Error("Authentication error: No token provided"));

    const payload = jwt.verify(token, process.env.JWT_SECRET);

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
    const secureRoom = `${socket.user.school_id}_${room}`;
    socket.join(secureRoom);
    console.log(`User ${socket.user.name} joined room: ${secureRoom}`);
  });

  socket.on("send_message", (data) => {
    const secureRoom = `${socket.user.school_id}_${data.room}`;
    const secureMessage = {
      id: data.id || Math.random().toString(36).substring(7), // 👈 NEW: Unique ID for optimistic UI
      room: data.room,
      message: data.message,
      time: data.time,
      sender: socket.user.name,
      role: socket.user.role,
    };
    // Broadcast message to everyone in the room
    io.to(secureRoom).emit("receive_message", secureMessage);
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
