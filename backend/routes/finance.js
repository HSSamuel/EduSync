const express = require("express");
const router = express.Router();
const pool = require("../db");
const authorize = require("../middleware/authorize");
const { emailQueue } = require("../utils/emailQueue");
const { logAudit } = require("../utils/auditLogger");
const { escapeHtml } = require("../utils/html");
const { isoDateRegex } = require("../utils/schoolValidation");
const { z } = require("zod");
const validate = require("../middleware/validate");
const { sendError, sendSuccess } = require("../utils/response");
const { withTransaction } = require("../utils/dbTransaction");
require("dotenv").config();

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? require("stripe")(stripeSecretKey) : null;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const createInvoiceSchema = z.object({
  student_id: z.coerce.number().int().positive(),
  title: z.string().trim().min(2, "Invoice title is required").max(255),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  due_date: z.string().trim().regex(isoDateRegex, "Due date must be in YYYY-MM-DD format"),
});

function formatCurrencyAmount(amount) {
  return Number(amount).toFixed(2);
}

function ensureStripeWebhookConfigured() {
  if (!process.env.STRIPE_SECRET_KEY) {
    const error = new Error("Stripe is not configured.");
    error.status = 503;
    error.code = "STRIPE_NOT_CONFIGURED";
    throw error;
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    const error = new Error("Stripe webhook secret is not configured.");
    error.status = 503;
    error.code = "STRIPE_WEBHOOK_NOT_CONFIGURED";
    throw error;
  }
}

async function getInvoiceForActor(invoiceId, user, executor = pool, { forUpdate = false } = {}) {
  const params = [invoiceId, user.school_id];
  let query = `
    SELECT i.invoice_id, i.student_id, i.school_id, i.title, i.amount, i.status, i.due_date, i.created_at,
           s.parent_id, s.user_id AS student_user_id, student_user.full_name AS student_name
    FROM invoices i
    JOIN students s ON i.student_id = s.student_id AND i.school_id = s.school_id
    JOIN users student_user ON s.user_id = student_user.user_id AND student_user.school_id = i.school_id
    WHERE i.invoice_id = $1 AND i.school_id = $2
  `;

  if (user.role === "Parent") {
    query += " AND s.parent_id = $3";
    params.push(user.user_id);
  } else if (user.role === "Student") {
    query += " AND s.user_id = $3";
    params.push(user.user_id);
  } else if (user.role !== "Admin") {
    return null;
  }

  if (forUpdate) {
    query += " FOR UPDATE";
  }

  const result = await executor.query(query, params);
  return result.rows[0] || null;
}

async function getStudentBillingProfile(studentId, schoolId, executor = pool) {
  const result = await executor.query(
    `
      SELECT s.student_id, s.parent_id, s.school_id,
             student_user.full_name AS student_name,
             student_user.email AS student_email,
             parent_user.email AS parent_email,
             parent_user.full_name AS parent_name
      FROM students s
      JOIN users student_user ON s.user_id = student_user.user_id AND student_user.school_id = s.school_id
      LEFT JOIN users parent_user ON s.parent_id = parent_user.user_id AND parent_user.school_id = s.school_id
      WHERE s.student_id = $1 AND s.school_id = $2
    `,
    [studentId, schoolId],
  );

  return result.rows[0] || null;
}

router.post("/invoices", authorize, validate(createInvoiceSchema), async (req, res, next) => {
  try {
    if (req.user.role !== "Admin") {
      return sendError(res, { status: 403, message: "Access Denied." });
    }

    const { student_id, title, amount, due_date } = req.body;

    const transactionResult = await withTransaction(async (client) => {
      const student = await getStudentBillingProfile(student_id, req.user.school_id, client);

      if (!student) {
        const error = new Error("Student not found in your school.");
        error.status = 404;
        throw error;
      }

      const newInvoice = await client.query(
        `
          INSERT INTO invoices (student_id, title, amount, due_date, school_id)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING invoice_id, student_id, school_id, title, amount, status, due_date, created_at
        `,
        [student_id, title.trim(), amount, due_date, req.user.school_id],
      );

      await logAudit({
        client,
        userId: req.user.user_id,
        action: "CREATE_INVOICE",
        targetTable: "invoices",
        recordId: newInvoice.rows[0].invoice_id,
        newValue: newInvoice.rows[0],
      });

      return {
        invoice: newInvoice.rows[0],
        student,
      };
    });

    if (transactionResult.student.parent_email) {
      const emailHTML = `
        <div style="font-family: Arial; max-width: 500px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
          <div style="background-color: #F59E0B; padding: 20px; text-align: center;">
            <h2 style="color: white; margin: 0;">New Invoice Issued</h2>
          </div>
          <div style="padding: 30px; background-color: #f9fafb;">
            <h3>Dear ${escapeHtml(transactionResult.student.parent_name || "Parent")},</h3>
            <p>A new invoice of <strong>₦${escapeHtml(formatCurrencyAmount(transactionResult.invoice.amount))}</strong> for <strong>${escapeHtml(transactionResult.invoice.title)}</strong> has been issued for ${escapeHtml(transactionResult.student.student_name)}.</p>
            <p>Please log in to your EduSync portal to view and pay this invoice by ${escapeHtml(new Date(transactionResult.invoice.due_date).toLocaleDateString())}.</p>
          </div>
        </div>
      `;

      try {
        await emailQueue.add("invoice-email", {
          to: transactionResult.student.parent_email,
          subject: `New Invoice: ${transactionResult.invoice.title}`,
          html: emailHTML,
        });
      } catch (queueError) {
        console.error("Invoice email queue failed:", queueError.message);
      }
    }

    return sendSuccess(res, {
      status: 201,
      message: "Invoice created successfully.",
      data: transactionResult.invoice,
    });
  } catch (err) {
    if (err.status) {
      return sendError(res, { status: err.status, message: err.message, code: err.code });
    }
    next(err);
  }
});

router.get("/invoices", authorize, async (req, res, next) => {
  try {
    let query = `
      SELECT i.invoice_id, i.student_id, i.school_id, i.title, i.amount, i.status, i.due_date, i.created_at,
             u.full_name AS student_name, s.class_grade
      FROM invoices i
      JOIN students s ON i.student_id = s.student_id AND i.school_id = s.school_id
      JOIN users u ON s.user_id = u.user_id AND u.school_id = i.school_id
      WHERE i.school_id = $1
      ORDER BY i.created_at DESC
    `;
    let queryParams = [req.user.school_id];

    if (req.user.role === "Parent") {
      query = `
        SELECT i.invoice_id, i.student_id, i.school_id, i.title, i.amount, i.status, i.due_date, i.created_at,
               u.full_name AS student_name, s.class_grade
        FROM invoices i
        JOIN students s ON i.student_id = s.student_id AND i.school_id = s.school_id
        JOIN users u ON s.user_id = u.user_id AND u.school_id = i.school_id
        WHERE s.parent_id = $1 AND i.school_id = $2
        ORDER BY i.created_at DESC
      `;
      queryParams = [req.user.user_id, req.user.school_id];
    } else if (req.user.role === "Student") {
      query = `
        SELECT i.invoice_id, i.student_id, i.school_id, i.title, i.amount, i.status, i.due_date, i.created_at,
               u.full_name AS student_name, s.class_grade
        FROM invoices i
        JOIN students s ON i.student_id = s.student_id AND i.school_id = s.school_id
        JOIN users u ON s.user_id = u.user_id AND u.school_id = i.school_id
        WHERE s.user_id = $1 AND i.school_id = $2
        ORDER BY i.created_at DESC
      `;
      queryParams = [req.user.user_id, req.user.school_id];
    } else if (req.user.role !== "Admin") {
      return sendError(res, { status: 403, message: "Access Denied." });
    }

    const invoices = await pool.query(query, queryParams);
    return sendSuccess(res, { data: invoices.rows });
  } catch (err) {
    next(err);
  }
});

router.post("/invoices/:id/checkout", authorize, async (req, res, next) => {
  try {
    const { id } = req.params;
    const invoice = await getInvoiceForActor(id, req.user);

    if (!invoice) {
      return sendError(res, {
        status: 404,
        message: "Invoice not found or not accessible.",
      });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return sendError(res, {
        status: 503,
        message: "Stripe is not configured.",
        code: "STRIPE_NOT_CONFIGURED",
      });
    }

    if (invoice.status === "Paid") {
      return sendError(res, {
        status: 400,
        message: "Invoice is already paid.",
      });
    }

    const session = await stripe.checkout.sessions.create(
      {
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "ngn",
              product_data: {
                name: invoice.title,
                description: `EduSync Academic Invoice for ${invoice.student_name}`,
              },
              unit_amount: Math.round(Number(invoice.amount) * 100),
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        metadata: {
          invoice_id: String(invoice.invoice_id),
          school_id: String(req.user.school_id),
          paid_by_user_id: String(req.user.user_id),
        },
        success_url: `${CLIENT_URL}/dashboard?payment_success=true`,
        cancel_url: `${CLIENT_URL}/dashboard?payment_canceled=true`,
      },
      {
        idempotencyKey: `invoice-checkout-${invoice.invoice_id}-user-${req.user.user_id}`,
      },
    );

    return sendSuccess(res, { data: { url: session.url } });
  } catch (err) {
    if (err.status) {
      return sendError(res, {
        status: err.status,
        message: err.message,
        code: err.code,
      });
    }
    next(err);
  }
});

router.post("/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    ensureStripeWebhookConfigured();
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`❌ Webhook Signature Error: ${err.message}`);
    return sendError(res, { status: 400, message: `Webhook Error: ${err.message}`, code: "WEBHOOK_SIGNATURE_ERROR" });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const invoiceId = Number(session.metadata.invoice_id);
    const schoolId = Number(session.metadata.school_id);
    const paidByUserId = session.metadata.paid_by_user_id
      ? Number(session.metadata.paid_by_user_id)
      : null;

    try {
      const transactionResult = await withTransaction(async (client) => {
        const invoiceCheck = await client.query(
          `
            SELECT invoice_id, student_id, school_id, title, amount, status, due_date, created_at
            FROM invoices
            WHERE invoice_id = $1 AND school_id = $2
            FOR UPDATE
          `,
          [invoiceId, schoolId],
        );

        if (invoiceCheck.rows.length === 0) {
          return { kind: "missing" };
        }

        const currentInvoice = invoiceCheck.rows[0];

        if (currentInvoice.status === "Paid") {
          return { kind: "already_paid" };
        }

        const updatedInvoice = await client.query(
          `
            UPDATE invoices
            SET status = 'Paid'
            WHERE invoice_id = $1 AND school_id = $2
            RETURNING invoice_id, student_id, school_id, title, amount, status, due_date, created_at
          `,
          [invoiceId, schoolId],
        );

        await logAudit({
          client,
          userId: paidByUserId,
          action: "PAY_INVOICE",
          targetTable: "invoices",
          recordId: invoiceId,
          oldValue: currentInvoice,
          newValue: updatedInvoice.rows[0],
        });

        const invoiceDetails = await client.query(
          `
            SELECT i.title, i.amount,
                   COALESCE(parent_user.email, student_user.email) AS email,
                   COALESCE(parent_user.full_name, student_user.full_name) AS full_name
            FROM invoices i
            JOIN students s ON i.student_id = s.student_id AND i.school_id = s.school_id
            JOIN users student_user ON s.user_id = student_user.user_id AND student_user.school_id = i.school_id
            LEFT JOIN users parent_user ON s.parent_id = parent_user.user_id AND parent_user.school_id = i.school_id
            WHERE i.invoice_id = $1 AND i.school_id = $2
          `,
          [invoiceId, schoolId],
        );

        return {
          kind: "paid",
          receiptRecipient: invoiceDetails.rows[0] || null,
        };
      });

      if (transactionResult.kind === "paid" && transactionResult.receiptRecipient?.email) {
        const details = transactionResult.receiptRecipient;
        const emailHTML = `
          <div style="font-family: Arial; max-width: 500px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
            <div style="background-color: #10B981; padding: 20px; text-align: center;">
              <h2 style="color: white; margin: 0;">Payment Receipt</h2>
            </div>
            <div style="padding: 30px; background-color: #f9fafb;">
              <h3>Thank you, ${escapeHtml(details.full_name)}!</h3>
              <p>We have successfully received your secure payment of <strong>₦${escapeHtml(formatCurrencyAmount(details.amount))}</strong> for <strong>${escapeHtml(details.title)}</strong>.</p>
              <p style="color: green; font-weight: bold;">Status: PAID ✅</p>
            </div>
          </div>
        `;

        try {
          await emailQueue.add("payment-receipt", {
            to: details.email,
            subject: `Payment Receipt: ${details.title}`,
            html: emailHTML,
          });
        } catch (queueError) {
          console.error("Payment receipt queue failed:", queueError.message);
        }
      }
    } catch (dbErr) {
      console.error(`❌ Webhook Database Error: ${dbErr.message}`);
      return sendError(res, { status: 500, message: "Webhook processing failed.", code: "WEBHOOK_DB_ERROR" });
    }
  }

  return sendSuccess(res, { data: { received: true } });
});

module.exports = router;
