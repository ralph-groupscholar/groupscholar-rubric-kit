const { Client } = require("pg");

const createTableQuery = `
  CREATE TABLE IF NOT EXISTS rubric_drift_log (
    id BIGSERIAL PRIMARY KEY,
    reviewer TEXT NOT NULL,
    session_date DATE,
    stage TEXT NOT NULL,
    drift_type TEXT NOT NULL,
    severity TEXT NOT NULL,
    notes TEXT NOT NULL,
    action_needed BOOLEAN NOT NULL DEFAULT FALSE,
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

    const totalsResult = await client.query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE severity = 'high')::int AS high_severity,
        COUNT(*) FILTER (WHERE action_needed)::int AS action_needed,
        MAX(created_at) AS last_entry
      FROM rubric_drift_log
    `);

    const stageResult = await client.query(`
      SELECT stage, COUNT(*)::int AS count
      FROM rubric_drift_log
      GROUP BY stage
      ORDER BY count DESC
    `);

    const typeResult = await client.query(`
      SELECT drift_type, COUNT(*)::int AS count
      FROM rubric_drift_log
      GROUP BY drift_type
      ORDER BY count DESC
    `);

    const stages = stageResult.rows.reduce((acc, row) => {
      if (row.stage) {
        acc[row.stage] = row.count;
      }
      return acc;
    }, {});

    const types = typeResult.rows.reduce((acc, row) => {
      if (row.drift_type) {
        acc[row.drift_type] = row.count;
      }
      return acc;
    }, {});

    const totals = totalsResult.rows[0] || {};
    res.status(200).json({
      total: totals.total ?? 0,
      high_severity: totals.high_severity ?? 0,
      action_needed: totals.action_needed ?? 0,
      last_entry: totals.last_entry || null,
      stages,
      types,
    });
  } catch (error) {
    res.status(500).json({ error: "Unable to load drift summary" });
  } finally {
    await client.end().catch(() => null);
  }
};
