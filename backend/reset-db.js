require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pool = require("./db");

async function resetDatabase() {
  console.log("⚠️ Starting database reset...");

  try {
    // 1. Wipe the entire public schema (this deletes all tables and data instantly)
    console.log("🗑️ Dropping all existing tables...");
    await pool.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");

    // 2. Read your database.sql file
    const sqlFilePath = path.join(__dirname, "database.sql");
    const sqlSchema = fs.readFileSync(sqlFilePath, "utf8");

    // 3. Rebuild the tables
    console.log("🏗️ Rebuilding database schema from database.sql...");
    await pool.query(sqlSchema);

    console.log("✅ Database completely wiped and successfully reset!");
  } catch (error) {
    console.error("❌ Failed to reset database:", error);
  } finally {
    // Close the connection pool so the script exits cleanly
    await pool.end();
  }
}

resetDatabase();
