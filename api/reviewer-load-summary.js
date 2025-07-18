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

function toCountMap(rows) {
  return rows.reduce((acc, row) => {
    if (row.risk_level) {
      acc[row.risk_level] = Number(row.count) || 0;
    }
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

    const summaryResult = await client.query(
      `
        SELECT
          COUNT(*)::int AS total,
          ROUND(AVG(assignments)::numeric, 1) AS avg_assignments,
          ROUND(SUM(hours)::numeric, 1) AS total_hours,
          SUM(CASE WHEN risk_level = 'high' THEN 1 ELSE 0 END)::int AS high_risk,
          MAX(created_at) AS last_checkin
        FROM rubric_kit_reviewer_load
      `
    );

    const riskMixResult = await client.query(
      `
        SELECT risk_level, COUNT(*)::int AS count
        FROM rubric_kit_reviewer_load
        GROUP BY risk_level
      `
    );

    const summary = summaryResult.rows[0] || {};

    res.status(200).json({
      total: summary.total ?? 0,
      avg_assignments: summary.avg_assignments ?? 0,
      total_hours: summary.total_hours ?? 0,
      high_risk: summary.high_risk ?? 0,
      last_checkin: summary.last_checkin || null,
      risk_mix: toCountMap(riskMixResult.rows || []),
    });
  } catch (error) {
    res.status(500).json({ error: "Unable to load reviewer load summary" });
  } finally {
    await client.end().catch(() => null);
  }
};
