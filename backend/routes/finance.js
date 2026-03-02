const express = require("express");
const router = express.Router();
const pool = require("../db");
const authorize = require("../middleware/authorize");
const { emailQueue } = require("../utils/emailQueue");
require("dotenv").config();

// Initialize Stripe
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// 1. CREATE A NEW INVOICE (Admin Only)
router.post("/invoices", authorize, async (req, res) => {
  try {
    if (req.user.role !== "Admin")
      return res.status(403).json({ error: "Access Denied." });

    const { student_id, title, amount, due_date } = req.body;

    const newInvoice = await pool.query(
      "INSERT INTO invoices (student_id, title, amount, due_date, school_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [student_id, title, amount, due_date, req.user.school_id],
    );

    const parentQuery = await pool.query(
      `
      SELECT p.email, p.full_name AS parent_name, s_user.full_name AS student_name
      FROM students s
      JOIN users p ON s.parent_id = p.user_id
      JOIN users s_user ON s.user_id = s_user.user_id
      WHERE s.student_id = $1 AND p.school_id = $2
    `,
      [student_id, req.user.school_id],
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
      await emailQueue.add("invoice-email", {
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

// 2. GET INVOICES
router.get("/invoices", authorize, async (req, res) => {
  try {
    let query = `
      SELECT i.*, u.full_name AS student_name, s.class_grade 
      FROM invoices i
      JOIN students s ON i.student_id = s.student_id
      JOIN users u ON s.user_id = u.user_id
      WHERE i.school_id = $1
      ORDER BY i.created_at DESC
    `;
    let queryParams = [req.user.school_id];

    if (req.user.role === "Parent") {
      query = `
        SELECT i.*, u.full_name AS student_name, s.class_grade 
        FROM invoices i
        JOIN students s ON i.student_id = s.student_id
        JOIN users u ON s.user_id = u.user_id
        WHERE s.parent_id = $1 AND i.school_id = $2
        ORDER BY i.created_at DESC
      `;
      queryParams = [req.user.user_id, req.user.school_id];
    } else if (req.user.role === "Student") {
      query = `
        SELECT i.*, u.full_name AS student_name, s.class_grade 
        FROM invoices i
        JOIN students s ON i.student_id = s.student_id
        JOIN users u ON s.user_id = u.user_id
        WHERE s.user_id = $1 AND i.school_id = $2
        ORDER BY i.created_at DESC
      `;
      queryParams = [req.user.user_id, req.user.school_id];
    }

    const invoices = await pool.query(query, queryParams);
    res.json(invoices.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// --- NEW: 3. CREATE STRIPE CHECKOUT SESSION ---
router.post("/invoices/:id/checkout", authorize, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify invoice exists and belongs to the user's school
    const invoiceQuery = await pool.query(
      "SELECT * FROM invoices WHERE invoice_id = $1 AND school_id = $2",
      [id, req.user.school_id],
    );

    if (invoiceQuery.rows.length === 0)
      return res.status(404).json({ error: "Invoice not found" });
    const invoice = invoiceQuery.rows[0];

    if (invoice.status === "Paid")
      return res.status(400).json({ error: "Invoice is already paid." });

    // Generate Stripe Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "ngn", // Change to "usd" if you prefer
            product_data: {
              name: invoice.title,
              description: "EduSync Academic Invoice",
            },
            unit_amount: Math.round(invoice.amount * 100), // Stripe expects the amount in the smallest currency unit (kobo/cents)
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      // If payment succeeds, redirect back to Dashboard with success flags
      success_url: `http://localhost:5173/dashboard?payment_success=true&invoice_id=${id}`,
      cancel_url: `http://localhost:5173/dashboard?payment_canceled=true`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Stripe connection failed." });
  }
});

// 4. PROCESS SUCCESSFUL PAYMENT (Called after Stripe redirects back)
router.put("/invoices/:id/pay", authorize, async (req, res) => {
  try {
    const { id } = req.params;

    const updatedInvoice = await pool.query(
      "UPDATE invoices SET status = 'Paid' WHERE invoice_id = $1 AND school_id = $2 RETURNING *",
      [id, req.user.school_id],
    );

    const invoiceDetails = await pool.query(
      `
      SELECT i.title, i.amount, u.email, u.full_name
      FROM invoices i
      JOIN students s ON i.student_id = s.student_id
      JOIN users u ON s.user_id = u.user_id
      WHERE i.invoice_id = $1 AND i.school_id = $2
    `,
      [id, req.user.school_id],
    );

    if (invoiceDetails.rows.length > 0) {
      const details = invoiceDetails.rows[0];
      const emailHTML = `
        <div style="font-family: Arial; max-width: 500px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
          <div style="background-color: #10B981; padding: 20px; text-align: center;">
            <h2 style="color: white; margin: 0;">Payment Receipt</h2>
          </div>
          <div style="padding: 30px; background-color: #f9fafb;">
            <h3>Thank you, ${details.full_name}!</h3>
            <p>We have successfully received your secure payment of <strong>₦${details.amount}</strong> for <strong>${details.title}</strong>.</p>
            <p style="color: green; font-weight: bold;">Status: PAID ✅</p>
          </div>
        </div>
      `;
      // Send receipt via background queue
      await emailQueue.add("payment-receipt", {
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
