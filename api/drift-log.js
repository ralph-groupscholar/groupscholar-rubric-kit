const { Client } = require("pg");

const REQUIRED_FIELDS = ["reviewer", "stage", "drift_type", "severity", "notes"];
const MAX_LENGTHS = {
  reviewer: 120,
  stage: 60,
  drift_type: 80,
  severity: 20,
  notes: 2000,
};

const ALLOWED_SEVERITY = new Set(["low", "medium", "high"]);

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

function normalizeDate(value) {
  if (!value) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().split("T")[0];
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
    stage: clamp(normalize(payload.stage), MAX_LENGTHS.stage),
    drift_type: clamp(normalize(payload.drift_type), MAX_LENGTHS.drift_type),
    severity: clamp(normalize(payload.severity), MAX_LENGTHS.severity),
    notes: clamp(normalize(payload.notes), MAX_LENGTHS.notes),
    session_date: normalizeDate(payload.session_date),
    action_needed: Boolean(payload.action_needed),
  };

  const missing = REQUIRED_FIELDS.filter((field) => !cleaned[field]);
  if (missing.length) {
    res.status(400).json({ error: `Missing fields: ${missing.join(", ")}` });
    return;
  }

  if (!ALLOWED_SEVERITY.has(cleaned.severity)) {
    res.status(400).json({ error: "Invalid severity" });
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
        INSERT INTO rubric_drift_log
          (reviewer, session_date, stage, drift_type, severity, notes, action_needed, source, user_agent)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `,
      [
        cleaned.reviewer,
        cleaned.session_date,
        cleaned.stage,
        cleaned.drift_type,
        cleaned.severity,
        cleaned.notes,
        cleaned.action_needed,
        "rubric-kit",
        req.headers["user-agent"] || null,
      ]
    );

    res.status(200).json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: "Unable to store drift log" });
  } finally {
    await client.end().catch(() => null);
  }
};
