const { Client } = require("pg");

const createTableQuery = `
  CREATE TABLE IF NOT EXISTS rubric_kit_feedback (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    email TEXT,
    stage TEXT NOT NULL,
    focus TEXT NOT NULL,
    notes TEXT NOT NULL,
    contact_ok BOOLEAN NOT NULL DEFAULT FALSE,
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
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    await client.query(createTableQuery);

    const result = await client.query(
      `
        SELECT name, role, stage, focus, notes, created_at
        FROM rubric_kit_feedback
        ORDER BY created_at DESC
        LIMIT 5
      `
    );

    res.status(200).json({
      items: result.rows || [],
    });
  } catch (error) {
    res.status(500).json({ error: "Unable to load recent feedback" });
  } finally {
    await client.end().catch(() => null);
  }
};
