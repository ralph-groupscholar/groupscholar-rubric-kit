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

    const trendResult = await client.query(
      `
        SELECT DATE_TRUNC('day', created_at) AS day, COUNT(*)::int AS count
        FROM rubric_kit_reviewer_load
        WHERE created_at >= NOW() - INTERVAL '13 days'
        GROUP BY day
        ORDER BY day ASC
      `
    );

    const avgResult = await client.query(
      `
        SELECT ROUND(AVG(hours)::numeric, 1) AS avg_hours
        FROM rubric_kit_reviewer_load
        WHERE created_at >= NOW() - INTERVAL '13 days'
      `
    );

    res.status(200).json({
      series: trendResult.rows || [],
      avg_hours: avgResult.rows[0]?.avg_hours ?? null,
    });
  } catch (error) {
    res.status(500).json({ error: "Unable to load reviewer load trends" });
  } finally {
    await client.end().catch(() => null);
  }
};
