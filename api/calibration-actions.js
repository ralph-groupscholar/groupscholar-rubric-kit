const { Client } = require("pg");

const createTableQuery = `
  CREATE TABLE IF NOT EXISTS rubric_calibration_actions (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    owner TEXT NOT NULL,
    priority TEXT NOT NULL,
    status TEXT NOT NULL,
    due_date DATE,
    notes TEXT,
    source TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
        SELECT
          id,
          title,
          owner,
          priority,
          status,
          due_date,
          notes,
          created_at
        FROM rubric_calibration_actions
        ORDER BY
          CASE status
            WHEN 'open' THEN 1
            WHEN 'in_progress' THEN 2
            WHEN 'blocked' THEN 3
            WHEN 'done' THEN 4
            ELSE 5
          END,
          CASE priority
            WHEN 'high' THEN 1
            WHEN 'medium' THEN 2
            WHEN 'low' THEN 3
            ELSE 4
          END,
          due_date NULLS LAST,
          created_at DESC
        LIMIT 8
      `
    );

    res.status(200).json({ entries: result.rows || [] });
  } catch (error) {
    res.status(500).json({ error: "Unable to load actions" });
  } finally {
    await client.end().catch(() => null);
  }
};
