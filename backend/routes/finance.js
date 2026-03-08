const express = require("express");
const router = express.Router();
const pool = require("../db");
const authorize = require("../middleware/authorize");
const { emailQueue } = require("../utils/emailQueue");
const { logAudit } = require("../utils/auditLogger");
const { z } = require("zod");
const validate = require("../middleware/validate");
require("dotenv").config();

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const createInvoiceSchema = z.object({
  student_id: z.coerce.number().int().positive(),
  title: z.string().trim().min(2, "Invoice title is required"),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  due_date: z.string().trim().min(1, "Due date is required"),
});

router.post("/invoices", authorize, validate(createInvoiceSchema), async (req, res, next) => {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({ error: "Access Denied." });
    }

    const { student_id, title, amount, due_date } = req.body;

    const studentQuery = await pool.query(
      `
        SELECT s.student_id, s.parent_id, student_user.full_name AS student_name,
               parent_user.email AS parent_email, parent_user.full_name AS parent_name
        FROM students s
        JOIN users student_user ON s.user_id = student_user.user_id
        LEFT JOIN users parent_user ON s.parent_id = parent_user.user_id
        WHERE s.student_id = $1 AND student_user.school_id = $2
      `,
      [student_id, req.user.school_id],
    );

    if (studentQuery.rows.length === 0) {
      return res.status(404).json({ error: "Student not found in your school." });
    }

    const student = studentQuery.rows[0];

    const newInvoice = await pool.query(
      "INSERT INTO invoices (student_id, title, amount, due_date, school_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [student_id, title, amount, due_date, req.user.school_id],
    );

    await logAudit({
      userId: req.user.user_id,
      action: "CREATE_INVOICE",
      targetTable: "invoices",
      recordId: newInvoice.rows[0].invoice_id,
      newValue: newInvoice.rows[0],
    });

    if (student.parent_email) {
      const emailHTML = `
        <div style="font-family: Arial; max-width: 500px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
          <div style="background-color: #F59E0B; padding: 20px; text-align: center;">
            <h2 style="color: white; margin: 0;">New Invoice Issued</h2>
          </div>
          <div style="padding: 30px; background-color: #f9fafb;">
            <h3>Dear ${student.parent_name},</h3>
            <p>A new invoice of <strong>₦${amount}</strong> for <strong>${title}</strong> has been issued for ${student.student_name}.</p>
            <p>Please log in to your EduSync portal to view and pay this invoice by ${new Date(due_date).toLocaleDateString()}.</p>
          </div>
        </div>
      `;
      await emailQueue.add("invoice-email", {
        to: student.parent_email,
        subject: `New Invoice: ${title}`,
        html: emailHTML,
      });
    }

    res.json(newInvoice.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.get("/invoices", authorize, async (req, res, next) => {
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
    next(err);
  }
});

router.post("/invoices/:id/checkout", authorize, async (req, res, next) => {
  try {
    const { id } = req.params;

    const invoiceQuery = await pool.query(
      "SELECT * FROM invoices WHERE invoice_id = $1 AND school_id = $2",
      [id, req.user.school_id],
    );

    if (invoiceQuery.rows.length === 0) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    const invoice = invoiceQuery.rows[0];

    if (invoice.status === "Paid") {
      return res.status(400).json({ error: "Invoice is already paid." });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "ngn",
            product_data: {
              name: invoice.title,
              description: "EduSync Academic Invoice",
            },
            unit_amount: Math.round(invoice.amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      metadata: {
        invoice_id: id,
        school_id: req.user.school_id,
      },
      success_url: `${CLIENT_URL}/dashboard?payment_success=true`,
      cancel_url: `${CLIENT_URL}/dashboard?payment_canceled=true`,
    });

    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: "Stripe connection failed." });
  }
});

router.post("/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`❌ Webhook Signature Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const invoiceId = session.metadata.invoice_id;
    const schoolId = session.metadata.school_id;

    try {
      const invoiceCheck = await pool.query(
        "SELECT * FROM invoices WHERE invoice_id = $1 AND school_id = $2",
        [invoiceId, schoolId],
      );

      if (invoiceCheck.rows.length > 0 && invoiceCheck.rows[0].status === "Paid") {
        return res.status(200).json({ received: true, message: "Invoice already processed" });
      }

      const updatedInvoice = await pool.query(
        "UPDATE invoices SET status = 'Paid' WHERE invoice_id = $1 AND school_id = $2 RETURNING *",
        [invoiceId, schoolId],
      );

      if (updatedInvoice.rows.length > 0) {
        await logAudit({
          userId: null,
          action: "PAY_INVOICE",
          targetTable: "invoices",
          recordId: invoiceId,
          oldValue: invoiceCheck.rows[0],
          newValue: updatedInvoice.rows[0],
        });
      }

      const invoiceDetails = await pool.query(
        `
          SELECT i.title, i.amount,
                 COALESCE(parent_user.email, student_user.email) AS email,
                 COALESCE(parent_user.full_name, student_user.full_name) AS full_name
          FROM invoices i
          JOIN students s ON i.student_id = s.student_id
          JOIN users student_user ON s.user_id = student_user.user_id
          LEFT JOIN users parent_user ON s.parent_id = parent_user.user_id
          WHERE i.invoice_id = $1 AND i.school_id = $2
        `,
        [invoiceId, schoolId],
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
        await emailQueue.add("payment-receipt", {
          to: details.email,
          subject: `Payment Receipt: ${details.title}`,
          html: emailHTML,
        });
      }
    } catch (dbErr) {
      console.error(`❌ Webhook Database Error: ${dbErr.message}`);
    }
  }

  res.status(200).json({ received: true });
});

module.exports = router;
