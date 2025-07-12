const { Client } = require("pg");

const createTableQuery = `
  CREATE TABLE IF NOT EXISTS rubric_calibration_drift (
    id BIGSERIAL PRIMARY KEY,
    criterion TEXT NOT NULL,
    spread INTEGER NOT NULL,
    issue_type TEXT NOT NULL,
    notes TEXT NOT NULL,
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

    const { rows } = await client.query(
      `
        SELECT
          COUNT(*)::int AS total,
          ROUND(AVG(spread)::numeric, 1) AS average_spread,
          COUNT(*) FILTER (WHERE spread >= 4)::int AS high_risk,
          MAX(created_at) AS last_entry
        FROM rubric_calibration_drift;
      `
    );

    const summary = rows[0] || {};

    res.status(200).json({
      total: summary.total ?? 0,
      average_spread: summary.average_spread ? Number(summary.average_spread) : 0,
      high_risk: summary.high_risk ?? 0,
      last_entry: summary.last_entry,
    });
  } catch (error) {
    res.status(500).json({ error: "Unable to load drift summary" });
  } finally {
    await client.end().catch(() => null);
  }
};
