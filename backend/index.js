const express = require("express");
const cors = require("cors");
const pool = require("./db");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

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

// --- DATABASE & SERVER STARTUP ---
pool
  .connect()
  .then(() => {
    console.log("📦 Successfully connected to the PostgreSQL Database!");
    app.listen(PORT, () => {
      console.log(`🚀 Server is officially running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Database connection error:", err.stack);
  });
