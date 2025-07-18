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

const seeds = [
  {
    name: "Maya Collins",
    role: "Panel lead",
    email: "maya.collins@northbridge.org",
    stage: "prep",
    focus: "clarity",
    notes:
      "Mission fit anchors need clearer language for first-gen pathways; reviewers asked for examples.",
    contact_ok: true,
    daysAgo: 18,
  },
  {
    name: "DeShawn Patel",
    role: "Reviewer",
    email: "",
    stage: "scoring",
    focus: "evidence",
    notes:
      "We are missing artifacts that show community leadership beyond clubs; consider adding prompts.",
    contact_ok: false,
    daysAgo: 14,
  },
  {
    name: "Elena Ruiz",
    role: "Program manager",
    email: "elena.ruiz@rivercity.org",
    stage: "decision",
    focus: "bias",
    notes:
      "Bias interruption checklist helped, but we still need guardrails for legacy-school prestige signals.",
    contact_ok: true,
    daysAgo: 12,
  },
  {
    name: "Jordan Kim",
    role: "External reader",
    email: "jordan.kim@horizons.org",
    stage: "scoring",
    focus: "workflow",
    notes:
      "Workflow slowed when cross-checking references; a shared evidence tracker would help.",
    contact_ok: true,
    daysAgo: 9,
  },
  {
    name: "Aisha Ward",
    role: "Reviewer",
    email: "",
    stage: "post",
    focus: "calibration",
    notes:
      "Calibration drift spiked after the new STEM rubric; need anchor examples for score 4.",
    contact_ok: false,
    daysAgo: 6,
  },
  {
    name: "Noah Bennett",
    role: "Scholarship director",
    email: "noah.bennett@uplift.edu",
    stage: "decision",
    focus: "clarity",
    notes:
      'We need to align on what counts as "community impact" vs. "leadership".',
    contact_ok: true,
    daysAgo: 5,
  },
  {
    name: "Priya Shah",
    role: "Reviewer",
    email: "",
    stage: "prep",
    focus: "workflow",
    notes:
      "The prep checklist is strong; add a 10-minute reviewer walkthrough before scoring begins.",
    contact_ok: false,
    daysAgo: 3,
  },
  {
    name: "Luis Romero",
    role: "Panelist",
    email: "luis.romero@futurebridge.org",
    stage: "scoring",
    focus: "evidence",
    notes:
      "Evidence gaps around caregiving responsibilities; propose adding context prompts.",
    contact_ok: true,
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
    throw new Error("DATABASE_URL is required to seed feedback data.");
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
  });

  await client.connect();
  await client.query(createTableQuery);

  const existing = await client.query(
    "SELECT COUNT(*)::int AS count FROM rubric_kit_feedback WHERE source = 'seed'"
  );

  if ((existing.rows[0]?.count || 0) > 0) {
    await client.end();
    return;
  }

  for (const entry of seeds) {
    await client.query(
      `
        INSERT INTO rubric_kit_feedback
          (name, role, email, stage, focus, notes, contact_ok, source, user_agent, created_at)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `,
      [
        entry.name,
        entry.role,
        entry.email || null,
        entry.stage,
        entry.focus,
        entry.notes,
        entry.contact_ok,
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
