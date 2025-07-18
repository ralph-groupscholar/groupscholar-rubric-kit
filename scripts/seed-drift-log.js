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

const seeds = [
  {
    reviewer: "Avery Chen",
    stage: "scoring",
    drift_type: "criteria",
    severity: "high",
    notes: "Split on what counts as leadership vs community impact for gap-year applicants.",
    action_needed: true,
    sessionDaysAgo: 4,
    createdDaysAgo: 3,
  },
  {
    reviewer: "Jordan Patel",
    stage: "decision",
    drift_type: "consensus",
    severity: "medium",
    notes: "Panel alignment broke when weighting access hardship narratives.",
    action_needed: true,
    sessionDaysAgo: 7,
    createdDaysAgo: 6,
  },
  {
    reviewer: "Maya Ortiz",
    stage: "prep",
    drift_type: "evidence",
    severity: "medium",
    notes: "Reviewers want more examples of what qualifies as sustained impact.",
    action_needed: false,
    sessionDaysAgo: 9,
    createdDaysAgo: 8,
  },
  {
    reviewer: "Samuel Brooks",
    stage: "scoring",
    drift_type: "scoring",
    severity: "low",
    notes: "Score spread widened on extracurricular depth when profiles include paid work.",
    action_needed: false,
    sessionDaysAgo: 5,
    createdDaysAgo: 4,
  },
  {
    reviewer: "Priya Desai",
    stage: "post",
    drift_type: "bias",
    severity: "high",
    notes: "Need stronger bias interrupt for legacy school references in essays.",
    action_needed: true,
    sessionDaysAgo: 12,
    createdDaysAgo: 10,
  },
];

function toTimestamp(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
}

function toDate(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split("T")[0];
}

async function seed() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to seed drift logs.");
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
  });

  await client.connect();
  await client.query(createTableQuery);

  const existing = await client.query(
    "SELECT COUNT(*)::int AS count FROM rubric_drift_log WHERE source = 'seed'"
  );

  if ((existing.rows[0]?.count || 0) > 0) {
    await client.end();
    return;
  }

  for (const entry of seeds) {
    await client.query(
      `
        INSERT INTO rubric_drift_log
          (reviewer, session_date, stage, drift_type, severity, notes, action_needed, source, user_agent, created_at)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `,
      [
        entry.reviewer,
        toDate(entry.sessionDaysAgo),
        entry.stage,
        entry.drift_type,
        entry.severity,
        entry.notes,
        entry.action_needed,
        "seed",
        "seed-script",
        toTimestamp(entry.createdDaysAgo),
      ]
    );
  }

  await client.end();
}

seed().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
