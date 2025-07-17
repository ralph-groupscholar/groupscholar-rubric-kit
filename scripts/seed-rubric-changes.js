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

const seeds = [
  {
    title: "Add context rubric for caregiving responsibilities",
    area: "criteria",
    impact: "high",
    status: "in_progress",
    owner: "Lena Ortiz",
    notes: "Draft updated anchors + evidence prompts before March cycle.",
    createdDaysAgo: 6,
    dueDaysFromNow: 7,
  },
  {
    title: "Clarify leadership vs community impact weighting",
    area: "weights",
    impact: "medium",
    status: "proposed",
    owner: "Marco Silva",
    notes: "Need to align with sponsor emphasis on community impact.",
    createdDaysAgo: 4,
    dueDaysFromNow: 12,
  },
  {
    title: "Add evidence prompts for first-gen support systems",
    area: "evidence",
    impact: "high",
    status: "approved",
    owner: "Anika Shah",
    notes: "Update reviewer brief and intake prompts.",
    createdDaysAgo: 8,
    dueDaysFromNow: 3,
  },
  {
    title: "Create scoring anchor guide for creative projects",
    area: "scoring",
    impact: "medium",
    status: "in_progress",
    owner: "Omar Reyes",
    notes: "Collect two sample portfolios for calibration.",
    createdDaysAgo: 10,
    dueDaysFromNow: 9,
  },
  {
    title: "Update training flow to reduce workflow friction",
    area: "workflow",
    impact: "low",
    status: "shipped",
    owner: "Nina Park",
    notes: "Added 15-minute async walkthrough and FAQ section.",
    createdDaysAgo: 14,
    dueDaysFromNow: -2,
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
    throw new Error("DATABASE_URL is required to seed rubric changes.");
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
  });

  await client.connect();
  await client.query(createTableQuery);

  const existing = await client.query(
    "SELECT COUNT(*)::int AS count FROM rubric_kit_changes WHERE source = 'seed'"
  );

  if ((existing.rows[0]?.count || 0) > 0) {
    await client.end();
    return;
  }

  for (const entry of seeds) {
    await client.query(
      `
        INSERT INTO rubric_kit_changes
          (title, area, impact, status, owner, due_date, notes, source, user_agent, created_at)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `,
      [
        entry.title,
        entry.area,
        entry.impact,
        entry.status,
        entry.owner,
        toDateFromNow(entry.dueDaysFromNow),
        entry.notes,
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
