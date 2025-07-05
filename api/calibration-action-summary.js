const { Client } = require("pg");

const createTableQuery = `
  CREATE TABLE IF NOT EXISTS rubric_calibration_actions (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    owner TEXT NOT NULL,
    priority TEXT NOT NULL,
    status TEXT NOT NULL,
    due_date DATE,
    notes TEXT,
    source TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`;

function toMap(rows) {
  return rows.reduce((acc, row) => {
    if (row && row.key) {
      acc[row.key] = row.count;
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

    const totalResult = await client.query(
      "SELECT COUNT(*)::int AS count FROM rubric_calibration_actions"
    );
    const lastResult = await client.query(
      "SELECT MAX(created_at) AS last_action FROM rubric_calibration_actions"
    );
    const statusResult = await client.query(
      `
        SELECT status AS key, COUNT(*)::int AS count
        FROM rubric_calibration_actions
        GROUP BY status
      `
    );
    const priorityResult = await client.query(
      `
        SELECT priority AS key, COUNT(*)::int AS count
        FROM rubric_calibration_actions
        GROUP BY priority
      `
    );
    const dueSoonResult = await client.query(
      `
        SELECT COUNT(*)::int AS count
        FROM rubric_calibration_actions
        WHERE status != 'done'
          AND due_date IS NOT NULL
          AND due_date >= NOW()::date
          AND due_date <= (NOW()::date + INTERVAL '7 days')
      `
    );

    res.status(200).json({
      total: totalResult.rows[0]?.count || 0,
      last_action: lastResult.rows[0]?.last_action || null,
      due_soon: dueSoonResult.rows[0]?.count || 0,
      statuses: toMap(statusResult.rows || []),
      priorities: toMap(priorityResult.rows || []),
    });
  } catch (error) {
    res.status(500).json({ error: "Unable to load action summary" });
  } finally {
    await client.end().catch(() => null);
  }
};
