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

function mapCounts(rows) {
  return rows.reduce((acc, row) => {
    acc[row.key] = Number(row.count) || 0;
    return acc;
  }, {});
}

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
        FROM rubric_kit_feedback
        WHERE created_at >= NOW() - INTERVAL '13 days'
        GROUP BY day
        ORDER BY day ASC
      `
    );

    const focusResult = await client.query(
      `
        SELECT focus AS key, COUNT(*)::int AS count
        FROM rubric_kit_feedback
        WHERE created_at >= NOW() - INTERVAL '6 days'
        GROUP BY focus
      `
    );

    const stageResult = await client.query(
      `
        SELECT stage AS key, COUNT(*)::int AS count
        FROM rubric_kit_feedback
        WHERE created_at >= NOW() - INTERVAL '6 days'
        GROUP BY stage
      `
    );

    res.status(200).json({
      series: trendResult.rows || [],
      focus: mapCounts(focusResult.rows || []),
      stages: mapCounts(stageResult.rows || []),
    });
  } catch (error) {
    res.status(500).json({ error: "Unable to load trend data" });
  } finally {
    await client.end().catch(() => null);
  }
};
