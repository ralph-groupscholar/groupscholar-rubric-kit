const { Client } = require("pg");

const REQUIRED_FIELDS = ["name", "role", "stage", "focus", "notes"];
const MAX_LENGTHS = {
  name: 120,
  role: 120,
  email: 200,
  stage: 60,
  focus: 80,
  notes: 2000,
};

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
    name: clamp(normalize(payload.name), MAX_LENGTHS.name),
    role: clamp(normalize(payload.role), MAX_LENGTHS.role),
    email: clamp(normalize(payload.email), MAX_LENGTHS.email),
    stage: clamp(normalize(payload.stage), MAX_LENGTHS.stage),
    focus: clamp(normalize(payload.focus), MAX_LENGTHS.focus),
    notes: clamp(normalize(payload.notes), MAX_LENGTHS.notes),
    contact_ok: Boolean(payload.contact_ok),
  };

  const missing = REQUIRED_FIELDS.filter((field) => !cleaned[field]);
  if (missing.length) {
    res.status(400).json({ error: `Missing fields: ${missing.join(", ")}` });
    return;
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    await client.query(createTableQuery);
    await client.query(
      `
        INSERT INTO rubric_kit_feedback
          (name, role, email, stage, focus, notes, contact_ok, source, user_agent)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `,
      [
        cleaned.name,
        cleaned.role,
        cleaned.email || null,
        cleaned.stage,
        cleaned.focus,
        cleaned.notes,
        cleaned.contact_ok,
        "rubric-kit",
        req.headers["user-agent"] || null,
      ]
    );

    res.status(200).json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: "Unable to store feedback" });
  } finally {
    await client.end().catch(() => null);
  }
};
