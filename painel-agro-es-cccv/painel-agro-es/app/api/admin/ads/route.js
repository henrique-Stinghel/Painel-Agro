import { randomUUID } from 'node:crypto';
import { isAdmin } from '../../../../lib/auth';
import { ensureAdsTable, listAds } from '../../../../lib/db';
import { normalizeAd, validateAd } from '../../../../lib/ads';

export async function GET() {
  if (!(await isAdmin())) return Response.json({ error: 'Não autorizado.' }, { status: 401 });
  try { return Response.json({ items: await listAds() }); }
  catch (error) { return Response.json({ error: error.message }, { status: 503 }); }
}

export async function POST(request) {
  if (!(await isAdmin())) return Response.json({ error: 'Não autorizado.' }, { status: 401 });
  const ad = normalizeAd(await request.json().catch(() => ({})));
  const error = validateAd(ad);
  if (error) return Response.json({ error }, { status: 400 });
  try {
    const sql = await ensureAdsTable();
    const id = randomUUID();
    const rows = await sql`
      INSERT INTO ads (id, company_name, call_to_action, image_url, target_url, position, starts_at, ends_at, active)
      VALUES (${id}, ${ad.companyName}, ${ad.callToAction}, ${ad.imageUrl}, ${ad.targetUrl}, ${ad.position}, ${ad.startsAt}, ${ad.endsAt}, ${ad.active})
      RETURNING *
    `;
    return Response.json(rows[0], { status: 201 });
  } catch (dbError) { return Response.json({ error: dbError.message }, { status: 503 }); }
}
