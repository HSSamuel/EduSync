const express = require("express");
const cors = require("cors");
const pool = require("./db");
const path = require("path");
const fs = require("fs");
const cookieParser = require("cookie-parser"); // Phase 1: Cookie Parser
const authorize = require("./middleware/authorize"); // Phase 1: Secure Downloads
require("dotenv").config();

// --- NEW: WEBSOCKET IMPORTS ---
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Wrap our Express app in a standard HTTP server
const server = http.createServer(app);

// 2. Attach Socket.io to that server and configure CORS
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Your React frontend URL
    methods: ["GET", "POST"],
    credentials: true, // Phase 1: Support secure cookies
  },
});

// --- MIDDLEWARE ---
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true, // Phase 1: Required for HTTP-only cookies
  }),
);
app.use(express.json({ limit: "10mb" })); // Phase 1: Protect against massive JSON payloads
app.use(cookieParser()); // Phase 1: Enables reading cookies securely

// --- FIX: SECURE FILE SERVING ---
// We replaced app.use('/uploads', express.static) with an authorized endpoint
app.get("/api/downloads/:filename", authorize, (req, res) => {
  const fileName = req.params.filename;
  const filePath = path.join(__dirname, "uploads", fileName);

  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: "File not found or access denied." });
  }
});

// --- ROUTES ---
app.get("/", (req, res) => {
  res.send("Welcome to the EduSync API! The server is alive.");
});

// The Manager delegating tasks to the new Departments!
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

// --- FIX: WEBSOCKET CONNECTION WITH ROOMS ---
io.on("connection", (socket) => {
  console.log(`🟢 User Connected: ${socket.id}`);

  // User requests to join a specific class/cohort room
  socket.on("join_room", (room) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room: ${room}`);
  });

  // Broadcast that message to EVERYONE IN THAT SPECIFIC ROOM
  socket.on("send_message", (data) => {
    io.to(data.room).emit("receive_message", data);
  });

  socket.on("disconnect", () => {
    console.log(`🔴 User Disconnected: ${socket.id}`);
  });
});

// --- DATABASE & SERVER STARTUP ---
pool
  .connect()
  .then(() => {
    console.log("📦 Successfully connected to the PostgreSQL Database!");

    // IMPORTANT: We use server.listen now to start both Express AND WebSockets!
    server.listen(PORT, () => {
      console.log(
        `🚀 Server & WebSockets are officially running on port ${PORT}`,
      );
    });
  })
  .catch((err) => {
    console.error("❌ Database connection error:", err.stack);
  });
