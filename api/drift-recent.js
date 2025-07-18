const { Client } = require("pg");

const createTableQuery = `
  CREATE TABLE IF NOT EXISTS rubric_drift_log (
    id BIGSERIAL PRIMARY KEY,
    reviewer TEXT NOT NULL,
    session_date DATE,
    stage TEXT NOT NULL,
    drift_type TEXT NOT NULL,
    severity TEXT NOT NULL,
    notes TEXT NOT NULL,
    action_needed BOOLEAN NOT NULL DEFAULT FALSE,
    source TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`;

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!process.env.DATABASE_URL) {
    res.status(500).json({ error: "Database not configured" });
    return;
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    await client.query(createTableQuery);

    const result = await client.query(`
      SELECT reviewer, stage, drift_type, severity, notes, action_needed, session_date, created_at
      FROM rubric_drift_log
      ORDER BY created_at DESC
      LIMIT 5
    `);

    res.status(200).json({ entries: result.rows });
  } catch (error) {
    res.status(500).json({ error: "Unable to load recent drift logs" });
  } finally {
    await client.end().catch(() => null);
  }
};
