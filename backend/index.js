const express = require("express");
const cors = require("cors");
const pool = require("./db");
const path = require("path");
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
  },
});

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // Serve uploaded files statically

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

// --- WEBSOCKET CONNECTION LOGIC (LIVE CHAT) ---
io.on("connection", (socket) => {
  console.log(`🟢 User Connected: ${socket.id}`);

  // Listen for a new message from a client
  socket.on("send_message", (data) => {
    // Broadcast that message to EVERYONE else connected
    io.emit("receive_message", data);
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
