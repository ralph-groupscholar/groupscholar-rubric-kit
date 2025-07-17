const { Client } = require("pg");

const REQUIRED_FIELDS = ["title", "area", "impact", "status", "owner"];
const MAX_LENGTHS = {
  title: 160,
  area: 80,
  impact: 40,
  status: 60,
  owner: 120,
  due_date: 20,
  notes: 2000,
};

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
  const raw = clamp(normalize(value), MAX_LENGTHS.due_date);
  if (!raw) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  return raw;
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
    area: clamp(normalize(payload.area), MAX_LENGTHS.area),
    impact: clamp(normalize(payload.impact), MAX_LENGTHS.impact),
    status: clamp(normalize(payload.status), MAX_LENGTHS.status),
    owner: clamp(normalize(payload.owner), MAX_LENGTHS.owner),
    due_date: normalizeDate(payload.due_date),
    notes: clamp(normalize(payload.notes), MAX_LENGTHS.notes),
  };

  const missing = REQUIRED_FIELDS.filter((field) => !cleaned[field]);
  if (missing.length) {
    res.status(400).json({ error: `Missing fields: ${missing.join(", ")}` });
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
        INSERT INTO rubric_kit_changes
          (title, area, impact, status, owner, due_date, notes, source, user_agent)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `,
      [
        cleaned.title,
        cleaned.area,
        cleaned.impact,
        cleaned.status,
        cleaned.owner,
        cleaned.due_date || null,
        cleaned.notes || null,
        "rubric-kit",
        req.headers["user-agent"] || null,
      ]
    );

    res.status(200).json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: "Unable to store change request" });
  } finally {
    await client.end().catch(() => null);
  }
};
