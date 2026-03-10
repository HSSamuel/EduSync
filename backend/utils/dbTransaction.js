const pool = require("../db");

async function withTransaction(work) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("Transaction rollback failed:", rollbackError.message);
    }
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { withTransaction };
