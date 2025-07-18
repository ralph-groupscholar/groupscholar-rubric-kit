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

const seeds = [
  {
    reviewer: "Jamie Park",
    role: "Panel lead",
    stage: "prep",
    assignments: 38,
    hours: 14.5,
    confidence: 4,
    risk_level: "medium",
    notes: "Need two more reviewers to absorb transfer applicant surge.",
    daysAgo: 12,
  },
  {
    reviewer: "Aliyah Brooks",
    role: "Reviewer",
    stage: "scoring",
    assignments: 52,
    hours: 20,
    confidence: 3,
    risk_level: "high",
    notes: "Requests extra time for STEM portfolios; adjust deadline buffer.",
    daysAgo: 9,
  },
  {
    reviewer: "Marco Santos",
    role: "Reviewer",
    stage: "scoring",
    assignments: 30,
    hours: 10,
    confidence: 5,
    risk_level: "low",
    notes: "On track after workload redistribution.",
    daysAgo: 7,
  },
  {
    reviewer: "Sierra Chen",
    role: "External reader",
    stage: "decision",
    assignments: 24,
    hours: 9.5,
    confidence: 4,
    risk_level: "medium",
    notes: "Needs decision brief earlier to stay aligned with panel.",
    daysAgo: 4,
  },
  {
    reviewer: "Devon Hall",
    role: "Reviewer",
    stage: "post",
    assignments: 18,
    hours: 6,
    confidence: 3,
    risk_level: "low",
    notes: "Available for debrief notes and rubric updates.",
    daysAgo: 2,
  },
];

function toTimestamp(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
}

async function seed() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to seed capacity data.");
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
  });

  await client.connect();
  await client.query(createTableQuery);

  const existing = await client.query(
    "SELECT COUNT(*)::int AS count FROM rubric_kit_capacity WHERE source = 'seed'"
  );

  if ((existing.rows[0]?.count || 0) > 0) {
    await client.end();
    return;
  }

  for (const entry of seeds) {
    await client.query(
      `
        INSERT INTO rubric_kit_capacity
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
