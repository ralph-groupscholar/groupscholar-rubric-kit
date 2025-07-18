const { Client } = require("pg");

const createTableQuery = `
  CREATE TABLE IF NOT EXISTS rubric_kit_reviewer_load (
    id BIGSERIAL PRIMARY KEY,
    reviewer TEXT NOT NULL,
    role TEXT NOT NULL,
    stage TEXT NOT NULL,
    assignments INTEGER NOT NULL,
    hours NUMERIC(6,2) NOT NULL,
    confidence INTEGER,
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
        WITH scored AS (
          SELECT
            reviewer,
            role,
            stage,
            assignments,
            hours,
            confidence,
            risk_level,
            notes,
            created_at,
            CASE
              WHEN risk_level = 'high' OR assignments >= 90 OR hours >= 45 THEN 'high'
              WHEN risk_level = 'medium' OR assignments >= 60 OR hours >= 30 THEN 'medium'
              ELSE 'low'
            END AS alert_level
          FROM rubric_kit_reviewer_load
        )
        SELECT *
        FROM scored
        WHERE alert_level <> 'low'
        ORDER BY
          CASE alert_level WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
          GREATEST(assignments, hours * 2) DESC,
          created_at DESC
        LIMIT 6
      `
    );

    res.status(200).json({ entries: result.rows || [] });
  } catch (error) {
    res.status(500).json({ error: "Unable to load reviewer load alerts" });
  } finally {
    await client.end().catch(() => null);
  }
};
