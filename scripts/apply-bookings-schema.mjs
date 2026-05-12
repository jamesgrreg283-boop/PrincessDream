/**
 * Applies all `supabase/migrations/*.sql` files in sorted order.
 *
 * Connection: see comments in this file (DATABASE_URL or SUPABASE_URL + SUPABASE_DB_PASSWORD).
 *
 * Run: npm run db:apply-bookings
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const migrationsDir = path.join(root, "supabase", "migrations");

function resolveConnectionString() {
  const direct = process.env.DATABASE_URL?.trim();
  if (direct) return direct;

  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const dbPass = process.env.SUPABASE_DB_PASSWORD?.trim();
  if (!supabaseUrl || !dbPass) return null;

  let host;
  try {
    const u = new URL(supabaseUrl);
    const sub = u.hostname.replace(".supabase.co", "");
    if (!sub || u.hostname === "supabase.co") return null;
    host = `db.${sub}.supabase.co`;
  } catch {
    return null;
  }

  const user = encodeURIComponent(process.env.SUPABASE_DB_USER?.trim() || "postgres");
  const pass = encodeURIComponent(dbPass);
  return `postgresql://${user}:${pass}@${host}:5432/postgres`;
}

const conn = resolveConnectionString();
if (!conn) {
  console.error(
    "Set either DATABASE_URL or both SUPABASE_URL + SUPABASE_DB_PASSWORD in .env.local."
  );
  process.exit(1);
}

const files = fs
  .readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

if (files.length === 0) {
  console.error("No .sql files in supabase/migrations");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: conn,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  for (const f of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, f), "utf8");
    await client.query(sql);
    console.log("Applied:", f);
  }
  console.log("All migrations applied successfully.");
} catch (e) {
  console.error(e.message || e);
  process.exit(1);
} finally {
  await client.end().catch(() => {});
}
