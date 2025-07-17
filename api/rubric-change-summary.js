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
          COUNT(*) FILTER (WHERE status <> 'shipped')::int AS open,
          COUNT(*) FILTER (WHERE impact = 'high')::int AS high_impact,
          MAX(created_at) AS last_change
        FROM rubric_kit_changes
      `
    );

    const statusResult = await client.query(
      `
        SELECT status AS key, COUNT(*)::int AS count
        FROM rubric_kit_changes
        GROUP BY status
      `
    );

    const impactResult = await client.query(
      `
        SELECT impact AS key, COUNT(*)::int AS count
        FROM rubric_kit_changes
        GROUP BY impact
      `
    );

    const areaResult = await client.query(
      `
        SELECT area AS key, COUNT(*)::int AS count
        FROM rubric_kit_changes
        GROUP BY area
      `
    );

    const totals = totalsResult.rows[0] || {
      total: 0,
      open: 0,
      high_impact: 0,
      last_change: null,
    };

    res.status(200).json({
      total: Number(totals.total) || 0,
      open: Number(totals.open) || 0,
      high_impact: Number(totals.high_impact) || 0,
      last_change: totals.last_change,
      statuses: mapCounts(statusResult.rows || []),
      impacts: mapCounts(impactResult.rows || []),
      areas: mapCounts(areaResult.rows || []),
    });
  } catch (error) {
    res.status(500).json({ error: "Unable to load change summary" });
  } finally {
    await client.end().catch(() => null);
  }
};
