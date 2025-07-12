const { Client } = require("pg");

const REQUIRED_FIELDS = ["criterion", "spread", "issue_type", "notes"];
const MAX_LENGTHS = {
  criterion: 160,
  issue_type: 60,
  notes: 1400,
};

const ALLOWED_ISSUES = new Set([
  "anchors",
  "weighting",
  "evidence",
  "consistency",
  "workflow",
]);

const createTableQuery = `
  CREATE TABLE IF NOT EXISTS rubric_calibration_drift (
    id BIGSERIAL PRIMARY KEY,
    criterion TEXT NOT NULL,
    spread INTEGER NOT NULL,
    issue_type TEXT NOT NULL,
    notes TEXT NOT NULL,
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

function normalizeSpread(value) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return null;
  if (parsed < 1 || parsed > 5) return null;
  return parsed;
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
    criterion: clamp(normalize(payload.criterion), MAX_LENGTHS.criterion),
    spread: normalizeSpread(payload.spread),
    issue_type: clamp(normalize(payload.issue_type), MAX_LENGTHS.issue_type),
    notes: clamp(normalize(payload.notes), MAX_LENGTHS.notes),
  };

  const missing = REQUIRED_FIELDS.filter((field) => !cleaned[field]);
  if (missing.length) {
    res.status(400).json({ error: `Missing fields: ${missing.join(", ")}` });
    return;
  }

  if (!ALLOWED_ISSUES.has(cleaned.issue_type)) {
    res.status(400).json({ error: "Invalid issue type" });
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
        INSERT INTO rubric_calibration_drift
          (criterion, spread, issue_type, notes, source, user_agent)
        VALUES
          ($1, $2, $3, $4, $5, $6)
      `,
      [
        cleaned.criterion,
        cleaned.spread,
        cleaned.issue_type,
        cleaned.notes,
        "rubric-kit",
        req.headers["user-agent"] || null,
      ]
    );

    res.status(200).json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: "Unable to store drift signal" });
  } finally {
    await client.end().catch(() => null);
  }
};
