export const AD_POSITIONS = ['topo', 'entre-cotacoes-clima', 'antes-radar'];

export function normalizeAd(input = {}) {
  const position = AD_POSITIONS.includes(input.position) ? input.position : 'topo';
  return {
    companyName: String(input.companyName || '').trim().slice(0, 120),
    callToAction: String(input.callToAction || '').trim().slice(0, 240),
    imageUrl: String(input.imageUrl || '').trim(),
    targetUrl: String(input.targetUrl || '').trim(),
    position,
    startsAt: input.startsAt || null,
    endsAt: input.endsAt || null,
    active: input.active !== false
  };
}

export function validateAd(ad) {
  if (!ad.companyName || !ad.callToAction || !ad.imageUrl || !ad.targetUrl) {
    return 'Preencha empresa, chamada, imagem e link.';
  }
  try {
    const target = new URL(ad.targetUrl);
    const image = new URL(ad.imageUrl);
    if (!['http:', 'https:'].includes(target.protocol) || !['http:', 'https:'].includes(image.protocol)) throw new Error();
  } catch {
    return 'Use endereços completos iniciados por http:// ou https://.';
  }
  if (ad.startsAt && ad.endsAt && new Date(ad.startsAt) > new Date(ad.endsAt)) {
    return 'A data final deve ser posterior à data inicial.';
  }
  return null;
}
