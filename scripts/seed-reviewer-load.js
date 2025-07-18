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

const seeds = [
  {
    reviewer: "Alex Morgan",
    role: "Panel lead",
    stage: "scoring",
    assignments: 42,
    hours: 18.5,
    confidence: 4,
    risk_level: "medium",
    notes: "Needs backup reviewer for STEM files if scoring spills into next week.",
    daysAgo: 10,
  },
  {
    reviewer: "Sofia Perez",
    role: "Reviewer",
    stage: "scoring",
    assignments: 58,
    hours: 26,
    confidence: 3,
    risk_level: "high",
    notes: "Overlapping community obligations. Consider redistributing 10 files.",
    daysAgo: 7,
  },
  {
    reviewer: "Caleb Wright",
    role: "External reader",
    stage: "prep",
    assignments: 24,
    hours: 9,
    confidence: 5,
    risk_level: "low",
    notes: "Has room for additional assignments if needed.",
    daysAgo: 5,
  },
  {
    reviewer: "Priya Nair",
    role: "Reviewer",
    stage: "decision",
    assignments: 36,
    hours: 14,
    confidence: 4,
    risk_level: "medium",
    notes: "Available for decision meeting prep this weekend.",
    daysAgo: 3,
  },
  {
    reviewer: "Jordan Lee",
    role: "Program manager",
    stage: "post",
    assignments: 18,
    hours: 6,
    confidence: 4,
    risk_level: "low",
    notes: "Focused on post-cycle audit and follow-up.",
    daysAgo: 1,
  },
];

function toTimestamp(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
}

async function seed() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to seed reviewer load data.");
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
  });

  await client.connect();
  await client.query(createTableQuery);

  const existing = await client.query(
    "SELECT COUNT(*)::int AS count FROM rubric_kit_reviewer_load WHERE source = 'seed'"
  );

  if ((existing.rows[0]?.count || 0) > 0) {
    await client.end();
    return;
  }

  for (const entry of seeds) {
    await client.query(
      `
        INSERT INTO rubric_kit_reviewer_load
          (reviewer, role, stage, assignments, hours, confidence, risk_level, notes, source, user_agent, created_at)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `,
      [
        entry.reviewer,
        entry.role,
        entry.stage,
        entry.assignments,
        entry.hours,
        entry.confidence,
        entry.risk_level,
        entry.notes,
        "seed",
        "seed-script",
        toTimestamp(entry.daysAgo),
      ]
    );
  }

  await client.end();
}

seed().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
