const { Client } = require("pg");

const createTableQuery = `
  CREATE TABLE IF NOT EXISTS rubric_kit_changes (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    area TEXT NOT NULL,
    impact TEXT NOT NULL,
    status TEXT NOT NULL,
    owner TEXT NOT NULL,
    due_date DATE,
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
        SELECT title, area, impact, status, owner, due_date, notes, created_at
        FROM rubric_kit_changes
        ORDER BY created_at DESC
        LIMIT 5
      `
    );

    res.status(200).json({ entries: result.rows || [] });
  } catch (error) {
    res.status(500).json({ error: "Unable to load change list" });
  } finally {
    await client.end().catch(() => null);
  }
};
