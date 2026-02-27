const express = require("express");
const router = express.Router();
const pool = require("../db");
const authorize = require("../middleware/authorize");
const sendEmail = require("../utils/sendEmail"); // 👈 The email engine for receipts!

// 1. CREATE A NEW INVOICE (Admin Only)
router.post("/invoices", authorize, async (req, res) => {
  try {
    if (req.user.role !== "Admin")
      return res.status(403).json({ error: "Access Denied." });

    const { student_id, title, amount, due_date } = req.body;

    const newInvoice = await pool.query(
      "INSERT INTO invoices (student_id, title, amount, due_date) VALUES ($1, $2, $3, $4) RETURNING *",
      [student_id, title, amount, due_date],
    );

    // Trigger an Email Alert to the Parent (if linked)
    const parentQuery = await pool.query(
      `
      SELECT p.email, p.full_name AS parent_name, s_user.full_name AS student_name
      FROM students s
      JOIN users p ON s.parent_id = p.user_id
      JOIN users s_user ON s.user_id = s_user.user_id
      WHERE s.student_id = $1
    `,
      [student_id],
    );

    if (parentQuery.rows.length > 0) {
      const parent = parentQuery.rows[0];
      const emailHTML = `
        <div style="font-family: Arial; max-width: 500px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
          <div style="background-color: #F59E0B; padding: 20px; text-align: center;">
            <h2 style="color: white; margin: 0;">New Invoice Issued</h2>
          </div>
          <div style="padding: 30px; background-color: #f9fafb;">
            <h3>Dear ${parent.parent_name},</h3>
            <p>A new invoice of <strong>₦${amount}</strong> for <strong>${title}</strong> has been issued for ${parent.student_name}.</p>
            <p>Please log in to your EduSync portal to view and pay this invoice by ${new Date(due_date).toLocaleDateString()}.</p>
          </div>
        </div>
      `;
      sendEmail({
        to: parent.email,
        subject: `New Invoice: ${title}`,
        html: emailHTML,
      });
    }

    res.json(newInvoice.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// 2. GET INVOICES (Admin sees all, Parents/Students see their own)
router.get("/invoices", authorize, async (req, res) => {
  try {
    let query = `
      SELECT i.*, u.full_name AS student_name, s.class_grade 
      FROM invoices i
      JOIN students s ON i.student_id = s.student_id
      JOIN users u ON s.user_id = u.user_id
      ORDER BY i.created_at DESC
    `;
    let queryParams = [];

    // If Parent, only show their children's invoices
    if (req.user.role === "Parent") {
      query = `
        SELECT i.*, u.full_name AS student_name, s.class_grade 
        FROM invoices i
        JOIN students s ON i.student_id = s.student_id
        JOIN users u ON s.user_id = u.user_id
        WHERE s.parent_id = $1
        ORDER BY i.created_at DESC
      `;
      queryParams = [req.user.user_id];
    }
    // If Student, only show their own invoices
    else if (req.user.role === "Student") {
      query = `
        SELECT i.*, u.full_name AS student_name, s.class_grade 
        FROM invoices i
        JOIN students s ON i.student_id = s.student_id
        JOIN users u ON s.user_id = u.user_id
        WHERE s.user_id = $1
        ORDER BY i.created_at DESC
      `;
      queryParams = [req.user.user_id];
    }

    const invoices = await pool.query(query, queryParams);
    res.json(invoices.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// 3. PROCESS PAYMENT (Simulated Gateway)
router.put("/invoices/:id/pay", authorize, async (req, res) => {
  try {
    const { id } = req.params;

    // Update invoice to Paid
    const updatedInvoice = await pool.query(
      "UPDATE invoices SET status = 'Paid' WHERE invoice_id = $1 RETURNING *",
      [id],
    );

    // Get details for the receipt
    const invoiceDetails = await pool.query(
      `
      SELECT i.title, i.amount, u.email, u.full_name
      FROM invoices i
      JOIN students s ON i.student_id = s.student_id
      JOIN users u ON s.user_id = u.user_id
      WHERE i.invoice_id = $1
    `,
      [id],
    );

    // Send Payment Receipt
    if (invoiceDetails.rows.length > 0) {
      const details = invoiceDetails.rows[0];
      const emailHTML = `
        <div style="font-family: Arial; max-width: 500px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
          <div style="background-color: #10B981; padding: 20px; text-align: center;">
            <h2 style="color: white; margin: 0;">Payment Receipt</h2>
          </div>
          <div style="padding: 30px; background-color: #f9fafb;">
            <h3>Thank you, ${details.full_name}!</h3>
            <p>We have successfully received your payment of <strong>₦${details.amount}</strong> for <strong>${details.title}</strong>.</p>
            <p style="color: green; font-weight: bold;">Status: PAID ✅</p>
          </div>
        </div>
      `;
      sendEmail({
        to: details.email,
        subject: `Payment Receipt: ${details.title}`,
        html: emailHTML,
      });
    }

    res.json({
      message: "Payment Successful!",
      invoice: updatedInvoice.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
