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
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    await client.query(createTableQuery);

    const totalsResult = await client.query(
      `
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE contact_ok)::int AS followup,
          MAX(created_at) AS last_submission
        FROM rubric_kit_feedback
      `
    );

    const stageResult = await client.query(
      `
        SELECT stage AS key, COUNT(*)::int AS count
        FROM rubric_kit_feedback
        GROUP BY stage
      `
    );

    const focusResult = await client.query(
      `
        SELECT focus AS key, COUNT(*)::int AS count
        FROM rubric_kit_feedback
        GROUP BY focus
      `
    );

    const roleResult = await client.query(
      `
        SELECT role AS key, COUNT(*)::int AS count
        FROM rubric_kit_feedback
        GROUP BY role
      `
    );

    const totals = totalsResult.rows[0] || {
      total: 0,
      followup: 0,
      last_submission: null,
    };

    res.status(200).json({
      total: Number(totals.total) || 0,
      followup: Number(totals.followup) || 0,
      last_submission: totals.last_submission,
      stages: mapCounts(stageResult.rows || []),
      focus: mapCounts(focusResult.rows || []),
      roles: mapCounts(roleResult.rows || []),
    });
  } catch (error) {
    res.status(500).json({ error: "Unable to load feedback summary" });
  } finally {
    await client.end().catch(() => null);
  }
};
