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

    const totalsResult = await client.query(
      `
        SELECT
          COUNT(*)::int AS total,
          AVG(assignments)::numeric(10,1) AS avg_assignments,
          AVG(hours)::numeric(10,1) AS avg_hours,
          SUM(CASE WHEN risk_level = 'high' THEN 1 ELSE 0 END)::int AS high_risk,
          MAX(created_at) AS last_entry
        FROM rubric_kit_capacity
      `
    );

    const riskResult = await client.query(
      `
        SELECT risk_level AS key, COUNT(*)::int AS count
        FROM rubric_kit_capacity
        GROUP BY risk_level
      `
    );

    const totals = totalsResult.rows[0] || {
      total: 0,
      avg_assignments: null,
      avg_hours: null,
      high_risk: 0,
      last_entry: null,
    };

    res.status(200).json({
      total: Number(totals.total) || 0,
      avg_assignments: totals.avg_assignments,
      avg_hours: totals.avg_hours,
      high_risk: Number(totals.high_risk) || 0,
      last_entry: totals.last_entry,
      risk_levels: mapCounts(riskResult.rows || []),
    });
  } catch (error) {
    res.status(500).json({ error: "Unable to load capacity summary" });
  } finally {
    await client.end().catch(() => null);
  }
};
