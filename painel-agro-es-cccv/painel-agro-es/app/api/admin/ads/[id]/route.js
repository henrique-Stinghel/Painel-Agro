import { del } from '@vercel/blob';
import { isAdmin } from '../../../../../lib/auth';
import { ensureAdsTable } from '../../../../../lib/db';
import { normalizeAd, validateAd } from '../../../../../lib/ads';

export async function PUT(request, { params }) {
  if (!(await isAdmin())) return Response.json({ error: 'Não autorizado.' }, { status: 401 });
  const { id } = await params;
  const ad = normalizeAd(await request.json().catch(() => ({})));
  const error = validateAd(ad);
  if (error) return Response.json({ error }, { status: 400 });
  try {
    const sql = await ensureAdsTable();
    const rows = await sql`
      UPDATE ads SET company_name=${ad.companyName}, call_to_action=${ad.callToAction}, image_url=${ad.imageUrl},
        target_url=${ad.targetUrl}, position=${ad.position}, starts_at=${ad.startsAt}, ends_at=${ad.endsAt},
        active=${ad.active}, updated_at=NOW()
      WHERE id=${id} RETURNING *
    `;
    if (!rows[0]) return Response.json({ error: 'Anúncio não encontrado.' }, { status: 404 });
    return Response.json(rows[0]);
  } catch (dbError) { return Response.json({ error: dbError.message }, { status: 503 }); }
}

export async function DELETE(_request, { params }) {
  if (!(await isAdmin())) return Response.json({ error: 'Não autorizado.' }, { status: 401 });
  const { id } = await params;
  try {
    const sql = await ensureAdsTable();
    const rows = await sql`DELETE FROM ads WHERE id=${id} RETURNING image_url`;
    if (!rows[0]) return Response.json({ error: 'Anúncio não encontrado.' }, { status: 404 });
    const blobToken = process.env.ADS_BLOB_READ_WRITE_TOKEN;
    if (blobToken && rows[0].image_url?.includes('.public.blob.vercel-storage.com')) {
      await del(rows[0].image_url, { token: blobToken }).catch(() => null);
    }
    return Response.json({ ok: true });
  } catch (dbError) { return Response.json({ error: dbError.message }, { status: 503 }); }
}
