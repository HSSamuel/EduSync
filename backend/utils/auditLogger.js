const pool = require('../db');

async function logAudit({
  userId,
  action,
  targetTable,
  recordId,
  oldValue = null,
  newValue = null,
}) {
  if (!userId || !action || !targetTable || recordId === undefined || recordId === null) {
    return;
  }

  try {
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, target_table, record_id, old_value, new_value)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        userId,
        action,
        targetTable,
        recordId,
        oldValue ? JSON.stringify(oldValue) : null,
        newValue ? JSON.stringify(newValue) : null,
      ],
    );
  } catch (err) {
    console.error('Audit log insert failed:', err.message);
  }
}

module.exports = { logAudit };
