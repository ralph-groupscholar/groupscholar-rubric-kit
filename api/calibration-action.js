const { Client } = require("pg");

const REQUIRED_FIELDS = ["title", "owner", "priority", "status"];
const MAX_LENGTHS = {
  title: 200,
  owner: 120,
  priority: 40,
  status: 40,
  notes: 1200,
};

const ALLOWED_STATUS = new Set(["open", "in_progress", "blocked", "done"]);
const ALLOWED_PRIORITY = new Set(["high", "medium", "low"]);

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
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
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
    title: clamp(normalize(payload.title), MAX_LENGTHS.title),
    owner: clamp(normalize(payload.owner), MAX_LENGTHS.owner),
    priority: clamp(normalize(payload.priority), MAX_LENGTHS.priority),
    status: clamp(normalize(payload.status), MAX_LENGTHS.status),
    notes: clamp(normalize(payload.notes), MAX_LENGTHS.notes),
    due_date: normalizeDate(payload.due_date),
  };

  const missing = REQUIRED_FIELDS.filter((field) => !cleaned[field]);
  if (missing.length) {
    res.status(400).json({ error: `Missing fields: ${missing.join(", ")}` });
    return;
  }

  if (!ALLOWED_STATUS.has(cleaned.status)) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }

  if (!ALLOWED_PRIORITY.has(cleaned.priority)) {
    res.status(400).json({ error: "Invalid priority" });
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
        INSERT INTO rubric_calibration_actions
          (title, owner, priority, status, due_date, notes, source, user_agent)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
      [
        cleaned.title,
        cleaned.owner,
        cleaned.priority,
        cleaned.status,
        cleaned.due_date,
        cleaned.notes || null,
        "rubric-kit",
        req.headers["user-agent"] || null,
      ]
    );

    res.status(200).json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: "Unable to store action item" });
  } finally {
    await client.end().catch(() => null);
  }
};
