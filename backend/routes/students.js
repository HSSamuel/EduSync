const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcrypt");
const authorize = require("../middleware/authorize");
const sendEmail = require("../utils/sendEmail"); // 👈 NEW: Imported our email engine!

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

    // --- NEW: TRIGGER THE AUTOMATED WELCOME EMAIL ---
    const emailHTML = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
        <div style="background-color: #2563EB; padding: 20px; text-align: center;">
          <h2 style="color: white; margin: 0;">Welcome to EduSync</h2>
        </div>
        <div style="padding: 30px; background-color: #f9fafb;">
          <h3 style="color: #1e3a8a;">Dear ${full_name},</h3>
          <p>Welcome to your new digital learning and management portal!</p>
          <p>Through your secure dashboard, you will be able to download study materials and view your official report cards.</p>
          <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px dashed #cbd5e1;">
            <p style="margin: 0 0 10px 0;"><strong>Your Login Credentials:</strong></p>
            <p style="margin: 0;"><strong>Portal Link:</strong> http://localhost:5173/</p>
            <p style="margin: 0;"><strong>Username:</strong> ${email}</p>
            <p style="margin: 0;"><strong>Temporary Password:</strong> ${password}</p>
          </div>
          <p>Please log in and update your password as soon as possible.</p>
          <p style="margin-top: 30px;">Warm regards,<br/><strong>The Administration Team</strong></p>
        </div>
      </div>
    `;

    // We send this in the background so the app doesn't freeze waiting for Google
    sendEmail({
      to: email,
      subject: "Welcome to the EduSync Portal - Your Academic Dashboard",
      html: emailHTML,
    });
    // ------------------------------------------------

    // Send a beautiful combined summary back to the frontend
    res.json({
      message: "Student registered successfully! Welcome email dispatched.",
      user_account: newUser.rows[0],
      academic_record: newStudent.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
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

// 3. LINK A PARENT TO A STUDENT (Admin only)
router.put("/:id/link-parent", authorize, async (req, res) => {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({ error: "Access Denied." });
    }

    const student_id = req.params.id;
    const { parent_id } = req.body;

    await pool.query(
      "UPDATE students SET parent_id = $1 WHERE student_id = $2",
      [parent_id, student_id],
    );

    res.json({ message: "✅ Parent successfully linked to student!" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// 4. GET A PARENT'S CHILDREN (Parent only)
router.get("/my-children", authorize, async (req, res) => {
  try {
    if (req.user.role !== "Parent") {
      return res.status(403).json({ error: "Access Denied." });
    }

    // Find all students whose parent_id matches this logged-in user
    const children = await pool.query(
      `
      SELECT 
        students.student_id, 
        users.full_name, 
        students.class_grade 
      FROM students 
      JOIN users ON students.user_id = users.user_id 
      WHERE students.parent_id = $1
    `,
      [req.user.user_id],
    );

    res.json(children.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
