const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcrypt");
const authorize = require("../middleware/authorize");

// 1. REGISTER A NEW STUDENT (Only Admins allowed)
router.post("/", authorize, async (req, res) => {
  try {
    // Security checkpoint
    if (req.user.role !== "Admin") {
      return res
        .status(403)
        .json({ error: "Access Denied. Only Admins can register students." });
    }

    const { full_name, email, password, class_grade } = req.body;

    // Step 1: Hash the password
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const bcryptPassword = await bcrypt.hash(password, salt);

    // Step 2: Insert into the 'users' table (Hardcoding the role as 'Student')
    const newUser = await pool.query(
      "INSERT INTO users (full_name, email, password_hash, role) VALUES ($1, $2, $3, 'Student') RETURNING user_id, full_name, email",
      [full_name, email, bcryptPassword],
    );

    // Grab the ID the database just created for this user
    const newUserId = newUser.rows[0].user_id;

    // Step 3: Insert into the 'students' table using that new ID
    const newStudent = await pool.query(
      "INSERT INTO students (user_id, class_grade) VALUES ($1, $2) RETURNING *",
      [newUserId, class_grade],
    );

    // Send a beautiful combined summary back to the frontend
    res.json({
      message: "Student registered successfully!",
      user_account: newUser.rows[0],
      academic_record: newStudent.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res
      .status(500)
      .json({
        error: "Server Error. (Did you use an email that already exists?)",
      });
  }
});

// 2. GET ALL STUDENTS (Stitching users and students together!)
router.get("/", authorize, async (req, res) => {
  try {
    // We use a JOIN to grab the name/email from 'users' and the grade from 'students'
    const allStudents = await pool.query(`
      SELECT 
        students.student_id, 
        users.full_name, 
        users.email, 
        students.class_grade, 
        students.enrollment_date 
      FROM students 
      JOIN users ON students.user_id = users.user_id
    `);
    
    res.json(allStudents.rows);

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
