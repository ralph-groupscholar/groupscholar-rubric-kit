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
        SELECT
          stage,
          COUNT(*)::int AS total,
          ROUND(AVG(assignments)::numeric, 1) AS avg_assignments,
          ROUND(AVG(hours)::numeric, 1) AS avg_hours,
          SUM(CASE WHEN risk_level = 'high' THEN 1 ELSE 0 END)::int AS high_risk,
          MAX(created_at) AS last_checkin
        FROM rubric_kit_reviewer_load
        GROUP BY stage
        ORDER BY
          CASE stage
            WHEN 'prep' THEN 1
            WHEN 'scoring' THEN 2
            WHEN 'decision' THEN 3
            WHEN 'post' THEN 4
            ELSE 5
          END,
          total DESC
      `
    );

    res.status(200).json({ entries: result.rows || [] });
  } catch (error) {
    res.status(500).json({ error: "Unable to load stage load breakdown" });
  } finally {
    await client.end().catch(() => null);
  }
};
