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

function anonymizeName(name) {
  if (!name) return "Reviewer";
  const parts = name.trim().split(/\s+/);
  if (!parts.length) return "Reviewer";
  if (parts.length === 1) {
    return `${parts[0].slice(0, 1).toUpperCase()}.`;
  }
  const first = parts[0];
  const lastInitial = parts[parts.length - 1].slice(0, 1).toUpperCase();
  return `${first} ${lastInitial}.`;
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

    const result = await client.query(
      `
        SELECT reviewer, role, stage, assignments, hours, confidence, risk_level, notes, created_at
        FROM rubric_kit_reviewer_load
        ORDER BY created_at DESC
        LIMIT 5
      `
    );

    const entries = (result.rows || []).map((row) => ({
      reviewer_label: anonymizeName(row.reviewer),
      reviewer: row.reviewer,
      role: row.role,
      stage: row.stage,
      assignments: row.assignments,
      hours: row.hours,
      confidence: row.confidence,
      risk_level: row.risk_level,
      notes: row.notes,
      created_at: row.created_at,
    }));

    res.status(200).json({ entries });
  } catch (error) {
    res.status(500).json({ error: "Unable to load recent reviewer load" });
  } finally {
    await client.end().catch(() => null);
  }
};
