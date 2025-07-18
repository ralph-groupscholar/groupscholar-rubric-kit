const { Client } = require("pg");

const REQUIRED_FIELDS = [
  "reviewer",
  "role",
  "stage",
  "assignments",
  "hours",
  "risk_level",
];

const MAX_LENGTHS = {
  reviewer: 120,
  role: 120,
  stage: 60,
  risk_level: 20,
  notes: 1200,
};

const ALLOWED_RISKS = new Set(["low", "medium", "high"]);

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

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 20000) {
        reject(new Error("Payload too large"));
      }
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

function normalize(value) {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
}

function clamp(value, max) {
  if (!value) return value;
  return value.length > max ? value.slice(0, max) : value;
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function clampNumber(value, min, max) {
  if (value === null || value === undefined) return null;
  return Math.min(Math.max(value, min), max);
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!process.env.DATABASE_URL) {
    res.status(500).json({ error: "Database not configured" });
    return;
  }

  let payload = {};
  try {
    const rawBody = await readBody(req);
    payload = rawBody ? JSON.parse(rawBody) : {};
  } catch (error) {
    res.status(400).json({ error: "Invalid JSON payload" });
    return;
  }

  const riskLevel = clamp(normalize(payload.risk_level).toLowerCase(), MAX_LENGTHS.risk_level);
  const cleaned = {
    reviewer: clamp(normalize(payload.reviewer), MAX_LENGTHS.reviewer),
    role: clamp(normalize(payload.role), MAX_LENGTHS.role),
    stage: clamp(normalize(payload.stage), MAX_LENGTHS.stage),
    assignments: clampNumber(toNumber(payload.assignments), 0, 300),
    hours: clampNumber(toNumber(payload.hours), 0, 120),
    confidence: clampNumber(toNumber(payload.confidence), 1, 5),
    risk_level: riskLevel,
    notes: clamp(normalize(payload.notes), MAX_LENGTHS.notes),
  };

  const missing = REQUIRED_FIELDS.filter((field) => {
    if (field === "assignments" || field === "hours") {
      return cleaned[field] === null || cleaned[field] === undefined;
    }
    return !cleaned[field];
  });

  if (missing.length) {
    res.status(400).json({ error: `Missing fields: ${missing.join(", ")}` });
    return;
  }

  if (!ALLOWED_RISKS.has(cleaned.risk_level)) {
    res.status(400).json({ error: "Invalid risk level" });
    return;
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    await client.query(createTableQuery);
    await client.query(
      `
        INSERT INTO rubric_kit_reviewer_load
          (reviewer, role, stage, assignments, hours, confidence, risk_level, notes, source, user_agent)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `,
      [
        cleaned.reviewer,
        cleaned.role,
        cleaned.stage,
        cleaned.assignments,
        cleaned.hours,
        cleaned.confidence,
        cleaned.risk_level,
        cleaned.notes || null,
        "rubric-kit",
        req.headers["user-agent"] || null,
      ]
    );

    res.status(200).json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: "Unable to store reviewer load" });
  } finally {
    await client.end().catch(() => null);
  }
};
