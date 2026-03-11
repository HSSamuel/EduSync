const express = require('express');
const router = express.Router();
const pool = require('../db');
const authorize = require('../middleware/authorize');
const multer = require('multer');
const { storage, cloudinary } = require('../utils/cloudinary');
const { emailQueue } = require('../utils/emailQueue');
const validate = require('../middleware/validate');
const { escapeHtml } = require('../utils/html');
const {
  allowedDocumentMimeTypes,
  documentTitleSchema,
  broadcastSchema,
  eventSchema,
} = require('../utils/schoolValidation');
const { logAudit } = require('../utils/auditLogger');
const { sendError, sendSuccess } = require('../utils/response');

const { FILE_UPLOAD_RULES, createFileFilter, validateUploadedFile } = require('../utils/uploadConfig');

const upload = multer({
  storage,
  limits: { fileSize: FILE_UPLOAD_RULES.documents.maxFileSize },
  fileFilter: createFileFilter('documents'),
});

router.post('/documents', authorize, upload.single('document_file'), validateUploadedFile('documents'), async (req, res, next) => {
  const client = await pool.connect();

  try {
    if (req.user.role !== 'Admin') return sendError(res, { status: 403, message: 'Access Denied.' });

    const parsed = documentTitleSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, {
        status: 400,
        message: parsed.error.issues[0]?.message || 'Validation Failed',
        details: parsed.error.issues.map((issue) => `${issue.path.join('.') || 'Input'}: ${issue.message}`),
        code: 'VALIDATION_ERROR',
      });
    }

    if (!req.file) return sendError(res, { status: 400, message: 'No file was uploaded.' });

    const file_url = req.file.path;
    const { title } = parsed.data;

    await client.query('BEGIN');

    const newDoc = await client.query(
      `INSERT INTO school_documents (title, file_url, file_public_id, file_resource_type, uploaded_by, school_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING doc_id, title, file_url, file_public_id, file_resource_type, uploaded_by, school_id, uploaded_at`,
      [
        title,
        file_url,
        req.file.filename || null,
        req.file.resource_type || req.file.mimetype?.split('/')?.[0] || 'raw',
        req.user.user_id,
        req.user.school_id,
      ],
    );

    await logAudit({
      client,
      userId: req.user.user_id,
      action: 'UPLOAD_DOCUMENT',
      targetTable: 'school_documents',
      recordId: newDoc.rows[0].doc_id,
      newValue: {
        title: newDoc.rows[0].title,
        file_url: newDoc.rows[0].file_url,
        file_public_id: newDoc.rows[0].file_public_id,
        file_resource_type: newDoc.rows[0].file_resource_type,
      },
    });

    await client.query('COMMIT');

    return sendSuccess(res, {
      status: 201,
      message: 'Document uploaded successfully.',
      data: newDoc.rows[0],
    });
  } catch (err) {
    await client.query('ROLLBACK');
    return next(err);
  } finally {
    client.release();
  }
});

router.get('/documents', authorize, async (req, res, next) => {
  try {
    const docs = await pool.query(
      `SELECT doc_id, title, file_url, file_public_id, file_resource_type, uploaded_by, school_id, uploaded_at
       FROM school_documents WHERE school_id = $1 ORDER BY uploaded_at DESC`,
      [req.user.school_id],
    );
    return sendSuccess(res, { data: docs.rows });
  } catch (err) {
    return next(err);
  }
});

router.delete('/documents/:id', authorize, async (req, res, next) => {
  const client = await pool.connect();

  try {
    if (req.user.role !== 'Admin') return sendError(res, { status: 403, message: 'Access Denied.' });

    await client.query('BEGIN');

    const docQuery = await client.query(
      `SELECT doc_id, title, file_url, file_public_id, file_resource_type
       FROM school_documents WHERE doc_id = $1 AND school_id = $2 FOR UPDATE`,
      [req.params.id, req.user.school_id],
    );

    if (docQuery.rows.length === 0) {
      await client.query('ROLLBACK');
      return sendError(res, { status: 404, message: 'Document not found' });
    }

    const doc = docQuery.rows[0];

    await client.query('DELETE FROM school_documents WHERE doc_id = $1 AND school_id = $2', [req.params.id, req.user.school_id]);

    await logAudit({
      client,
      userId: req.user.user_id,
      action: 'DELETE_DOCUMENT',
      targetTable: 'school_documents',
      recordId: doc.doc_id,
      oldValue: {
        title: doc.title,
        file_url: doc.file_url,
        file_public_id: doc.file_public_id,
        file_resource_type: doc.file_resource_type,
      },
    });

    await client.query('COMMIT');

    if (doc.file_public_id) {
      await cloudinary.uploader.destroy(doc.file_public_id, {
        resource_type: doc.file_resource_type || 'raw',
        invalidate: true,
      });
    }

    return sendSuccess(res, { message: 'Document deleted successfully from DB and Cloudinary!' });
  } catch (err) {
    await client.query('ROLLBACK');
    return next(err);
  } finally {
    client.release();
  }
});

router.post('/broadcast', authorize, validate(broadcastSchema), async (req, res, next) => {
  try {
    if (req.user.role !== 'Admin') return sendError(res, { status: 403, message: 'Access Denied.' });

    const { audience, subject, message } = req.body;

    let query = "SELECT email, full_name FROM users WHERE role != 'Admin' AND school_id = $1";
    let queryParams = [req.user.school_id];

    if (audience !== 'All') {
      query = 'SELECT email, full_name FROM users WHERE role = $2 AND school_id = $1';
      queryParams = [req.user.school_id, audience];
    }

    const targetUsers = await pool.query(query, queryParams);

    if (targetUsers.rows.length === 0) {
      return sendError(res, { status: 400, message: 'No users found in this audience category.' });
    }

    const jobs = targetUsers.rows.map((user) => ({
      name: 'broadcast-email',
      data: {
        to: user.email,
        subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
            <div style="background-color: #2563EB; padding: 20px; text-align: center;">
              <h2 style="color: white; margin: 0;">📢 EduSync Official Broadcast</h2>
            </div>
            <div style="padding: 30px; background-color: #f9fafb;">
              <h3 style="color: #333;">Dear ${escapeHtml(user.full_name)},</h3>
              <p style="white-space: pre-wrap;">${escapeHtml(message)}</p>
              <p style="margin-top: 30px;">Warm regards,<br/><strong>The Administration Team</strong></p>
            </div>
          </div>
        `,
      },
    }));

    await emailQueue.addBulk(jobs);

    await logAudit({
      userId: req.user.user_id,
      action: 'QUEUE_BROADCAST',
      targetTable: 'users',
      recordId: req.user.user_id,
      newValue: {
        audience,
        subject,
        recipients: targetUsers.rows.length,
      },
    });

    return sendSuccess(res, {
      message: `Broadcast queued successfully for ${targetUsers.rows.length} recipient(s).`,
      data: { recipients: targetUsers.rows.length },
    });
  } catch (err) {
    return next(err);
  }
});

router.get('/events', authorize, async (req, res, next) => {
  try {
    const events = await pool.query(
      'SELECT event_id, title, event_date, event_type, school_id, created_by FROM events WHERE school_id = $1 ORDER BY event_date ASC',
      [req.user.school_id],
    );
    return sendSuccess(res, { data: events.rows });
  } catch (err) {
    return next(err);
  }
});

router.post('/events', authorize, validate(eventSchema), async (req, res, next) => {
  const client = await pool.connect();

  try {
    if (req.user.role !== 'Admin') return sendError(res, { status: 403, message: 'Access Denied.' });

    const { title, event_date, event_type } = req.body;

    await client.query('BEGIN');

    const newEvent = await client.query(
      `INSERT INTO events (title, event_date, event_type, created_by, school_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING event_id, title, event_date, event_type, created_by, school_id`,
      [title, event_date, event_type, req.user.user_id, req.user.school_id],
    );

    await logAudit({
      client,
      userId: req.user.user_id,
      action: 'CREATE_EVENT',
      targetTable: 'events',
      recordId: newEvent.rows[0].event_id,
      newValue: {
        title,
        event_date,
        event_type,
      },
    });

    await client.query('COMMIT');

    return sendSuccess(res, {
      status: 201,
      message: 'Event created successfully.',
      data: newEvent.rows[0],
    });
  } catch (err) {
    await client.query('ROLLBACK');
    return next(err);
  } finally {
    client.release();
  }
});

router.delete('/events/:id', authorize, async (req, res, next) => {
  const client = await pool.connect();

  try {
    if (req.user.role !== 'Admin') return sendError(res, { status: 403, message: 'Access Denied.' });

    await client.query('BEGIN');

    const existing = await client.query(
      'SELECT event_id, title, event_date, event_type FROM events WHERE event_id = $1 AND school_id = $2 FOR UPDATE',
      [req.params.id, req.user.school_id],
    );

    if (existing.rows.length === 0) {
      await client.query('ROLLBACK');
      return sendError(res, { status: 404, message: 'Event not found.' });
    }

    await client.query('DELETE FROM events WHERE event_id = $1 AND school_id = $2', [req.params.id, req.user.school_id]);

    await logAudit({
      client,
      userId: req.user.user_id,
      action: 'DELETE_EVENT',
      targetTable: 'events',
      recordId: existing.rows[0].event_id,
      oldValue: existing.rows[0],
    });

    await client.query('COMMIT');

    return sendSuccess(res, { message: 'Event deleted!' });
  } catch (err) {
    await client.query('ROLLBACK');
    return next(err);
  } finally {
    client.release();
  }
});

module.exports = router;
