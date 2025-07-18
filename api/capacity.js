const { Client } = require("pg");

const REQUIRED_FIELDS = ["reviewer", "role", "stage", "assignments", "hours", "risk_level"];
const MAX_LENGTHS = {
  reviewer: 140,
  role: 120,
  stage: 60,
  risk_level: 40,
  notes: 1600,
};

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
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
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

  const cleaned = {
    reviewer: clamp(normalize(payload.reviewer), MAX_LENGTHS.reviewer),
    role: clamp(normalize(payload.role), MAX_LENGTHS.role),
    stage: clamp(normalize(payload.stage), MAX_LENGTHS.stage),
    assignments: toNumber(payload.assignments),
    hours: toNumber(payload.hours),
    confidence: toNumber(payload.confidence),
    risk_level: clamp(normalize(payload.risk_level), MAX_LENGTHS.risk_level),
    notes: clamp(normalize(payload.notes), MAX_LENGTHS.notes),
  };

  const missing = REQUIRED_FIELDS.filter((field) => {
    const value = cleaned[field];
    if (field === "assignments" || field === "hours") {
      return value === null;
    }
    return !value;
  });

  if (missing.length) {
    res.status(400).json({ error: `Missing fields: ${missing.join(", ")}` });
    return;
  }

  if (cleaned.assignments < 0 || cleaned.assignments > 300) {
    res.status(400).json({ error: "Assignments must be between 0 and 300" });
    return;
  }

  if (cleaned.hours < 0 || cleaned.hours > 120) {
    res.status(400).json({ error: "Hours must be between 0 and 120" });
    return;
  }

  if (cleaned.confidence !== null) {
    const confidenceInt = Math.round(cleaned.confidence);
    if (confidenceInt < 1 || confidenceInt > 5) {
      res.status(400).json({ error: "Confidence must be between 1 and 5" });
      return;
    }
    cleaned.confidence = confidenceInt;
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
        INSERT INTO rubric_kit_capacity
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
    res.status(500).json({ error: "Unable to store capacity check-in" });
  } finally {
    await client.end().catch(() => null);
  }
};
