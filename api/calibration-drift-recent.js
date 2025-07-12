const { Client } = require("pg");

const createTableQuery = `
  CREATE TABLE IF NOT EXISTS rubric_calibration_drift (
    id BIGSERIAL PRIMARY KEY,
    criterion TEXT NOT NULL,
    spread INTEGER NOT NULL,
    issue_type TEXT NOT NULL,
    notes TEXT NOT NULL,
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

    const { rows } = await client.query(
      `
        SELECT criterion, spread, issue_type, notes, created_at
        FROM rubric_calibration_drift
        ORDER BY created_at DESC
        LIMIT 5;
      `
    );

    res.status(200).json({ entries: rows || [] });
  } catch (error) {
    res.status(500).json({ error: "Unable to load drift signals" });
  } finally {
    await client.end().catch(() => null);
  }
};
