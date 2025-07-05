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

const seeds = [
  {
    title: "Define score-4 anchors for STEM rubric",
    owner: "Elena Ruiz",
    priority: "high",
    status: "in_progress",
    notes: "Collect 2-3 anonymized samples from last cycle to ground anchors.",
    createdDaysAgo: 9,
    dueDaysFromNow: 4,
  },
  {
    title: "Clarify community impact vs leadership guidance",
    owner: "Noah Bennett",
    priority: "medium",
    status: "open",
    notes: "Draft a one-page decision rule and share with reviewers.",
    createdDaysAgo: 7,
    dueDaysFromNow: 10,
  },
  {
    title: "Add evidence prompts for caregiving responsibilities",
    owner: "Priya Shah",
    priority: "medium",
    status: "open",
    notes: "Update application prompts to capture caregiving constraints.",
    createdDaysAgo: 5,
    dueDaysFromNow: 14,
  },
  {
    title: "Set up reviewer walkthrough before scoring begins",
    owner: "Maya Collins",
    priority: "low",
    status: "done",
    notes: "Recorded 10-minute walkthrough and stored in reviewer portal.",
    createdDaysAgo: 12,
    dueDaysFromNow: -2,
  },
  {
    title: "Audit bias interruption checklist for legacy-school signals",
    owner: "Jordan Kim",
    priority: "high",
    status: "blocked",
    notes: "Waiting on admissions data team for context brief updates.",
    createdDaysAgo: 3,
    dueDaysFromNow: 6,
  },
];

function toTimestamp(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
}

function toDateFromNow(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

async function seed() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to seed calibration actions.");
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
  });

  await client.connect();
  await client.query(createTableQuery);

  const existing = await client.query(
    "SELECT COUNT(*)::int AS count FROM rubric_calibration_actions WHERE source = 'seed'"
  );

  if ((existing.rows[0]?.count || 0) > 0) {
    await client.end();
    return;
  }

  for (const entry of seeds) {
    await client.query(
      `
        INSERT INTO rubric_calibration_actions
          (title, owner, priority, status, due_date, notes, source, user_agent, created_at, updated_at)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `,
      [
        entry.title,
        entry.owner,
        entry.priority,
        entry.status,
        toDateFromNow(entry.dueDaysFromNow),
        entry.notes,
        "seed",
        "seed-script",
        toTimestamp(entry.createdDaysAgo),
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
