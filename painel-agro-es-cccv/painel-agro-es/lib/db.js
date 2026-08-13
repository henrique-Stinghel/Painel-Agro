import { neon } from '@neondatabase/serverless';

let initialized = false;

function sqlClient() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL não configurada');
  return neon(process.env.DATABASE_URL);
}

export async function ensureAdsTable() {
  const sql = sqlClient();
  if (!initialized) {
    await sql`
      CREATE TABLE IF NOT EXISTS ads (
        id UUID PRIMARY KEY,
        company_name TEXT NOT NULL,
        call_to_action TEXT NOT NULL,
        image_url TEXT NOT NULL,
        target_url TEXT NOT NULL,
        position TEXT NOT NULL,
        starts_at TIMESTAMPTZ,
        ends_at TIMESTAMPTZ,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    initialized = true;
  }
  return sql;
}

export async function listAds({ activeOnly = false } = {}) {
  const sql = await ensureAdsTable();
  if (activeOnly) {
    return sql`
      SELECT * FROM ads
      WHERE active = TRUE
        AND (starts_at IS NULL OR starts_at <= NOW())
        AND (ends_at IS NULL OR ends_at >= NOW())
      ORDER BY created_at ASC
    `;
  }
  return sql`SELECT * FROM ads ORDER BY created_at DESC`;
}
