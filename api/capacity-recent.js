const { Client } = require("pg");

const createTableQuery = `
  CREATE TABLE IF NOT EXISTS rubric_kit_capacity (
    id BIGSERIAL PRIMARY KEY,
    reviewer TEXT NOT NULL,
    role TEXT NOT NULL,
    stage TEXT NOT NULL,
    assignments INT NOT NULL,
    hours NUMERIC(6,2) NOT NULL,
    confidence INT,
    risk_level TEXT NOT NULL,
    notes TEXT,
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

    const result = await client.query(
      `
        SELECT reviewer, role, stage, assignments, hours, confidence, risk_level, notes, created_at
        FROM rubric_kit_capacity
        ORDER BY created_at DESC
        LIMIT 5
      `
    );

    res.status(200).json({ entries: result.rows || [] });
  } catch (error) {
    res.status(500).json({ error: "Unable to load recent capacity check-ins" });
  } finally {
    await client.end().catch(() => null);
  }
};
