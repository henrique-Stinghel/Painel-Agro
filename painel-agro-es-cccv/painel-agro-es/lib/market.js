const CCCV_URL = 'https://www.cccv.org.br/cotacao/';
const INCAPER_URL = 'https://incaper.es.gov.br/mercado-agricola';

function htmlToText(html) {
  return String(html || '').replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/gi, ' ').replace(/&amp;/gi, '&').replace(/&ccedil;/gi, 'ç').replace(/&aacute;/gi, 'á').replace(/&atilde;/gi, 'ã').replace(/&eacute;/gi, 'é').replace(/&iacute;/gi, 'í').replace(/&oacute;/gi, 'ó').replace(/&uacute;/gi, 'ú').replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code))).replace(/\s+/g, ' ').trim();
}
function brToNumber(value) { if (!value) return null; const number = Number(String(value).replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '')); return Number.isFinite(number) ? number : null; }

async function fetchCCCV() {
  const response = await fetch(CCCV_URL, { headers: { 'User-Agent': 'Mozilla/5.0 PainelAgroES/1.0', Accept: 'text/html,application/xhtml+xml' }, cache: 'no-store' });
  if (!response.ok) throw new Error(`CCCV respondeu ${response.status}`);
  const text = htmlToText(await response.text());
  const regex = /(?:^|\s)(\d{1,2})\s+([\d.]+,\d{2})\s+([\d.]+,\d{2})\s+([\d.]+,\d{2})(?=\s|$)/g;
  let match; let latest = null;
  while ((match = regex.exec(text)) !== null) { const day = Number(match[1]); if (day >= 1 && day <= 31) latest = { day, arabicaDura: brToNumber(match[2]), arabicaRio: brToNumber(match[3]), conilon: brToNumber(match[4]) }; }
  if (!latest) throw new Error('Não foi possível localizar os preços no conteúdo recebido da CCCV');
  return { quoteDate: `Dia ${latest.day}`, ...latest };
}

async function fetchIncaper() {
  const response = await fetch(INCAPER_URL, { headers: { 'User-Agent': 'Mozilla/5.0 PainelAgroES/1.0', Accept: 'text/html,application/xhtml+xml' }, cache: 'no-store' });
  if (!response.ok) throw new Error(`Incaper respondeu ${response.status}`);
  const text = htmlToText(await response.text());
  const date = text.match(/Preço recebido pelo produtor\s+(\d{2}\/\d{2}\/\d{4})/i)?.[1] || null;
  const match = text.match(/Boi Gordo Castrado\s+R\$\s*([\d.]+,\d{2})\s+R\$\s*([\d.]+,\d{2})\s+R\$\s*([\d.]+,\d{2})/i);
  if (!match) throw new Error('Não foi possível localizar a cotação do boi no Incaper');
  return { quoteDate: date, minimum: brToNumber(match[1]), average: brToNumber(match[2]), maximum: brToNumber(match[3]) };
}

export async function getMarketSnapshot() {
  const [coffeeResult, cattleResult] = await Promise.allSettled([fetchCCCV(), fetchIncaper()]);
  const cccv = coffeeResult.status === 'fulfilled' ? coffeeResult.value : null;
  const incaper = cattleResult.status === 'fulfilled' ? cattleResult.value : null;
  return {
    source: cccv || incaper ? 'CCCV + Incaper' : 'Fontes indisponíveis no momento', sourceUrl: CCCV_URL,
    quoteDate: cccv?.quoteDate || incaper?.quoteDate || null, updatedAt: new Date().toISOString(),
    errors: { cccv: coffeeResult.status === 'rejected' ? coffeeResult.reason?.message : null, incaper: cattleResult.status === 'rejected' ? cattleResult.reason?.message : null },
    items: [
      { id: 'arabica-dura', label: 'Arábica Dura', unit: 'saca 60 kg', value: cccv?.arabicaDura ?? null, changePct: null, source: 'CCCV', marketType: 'physical' },
      { id: 'arabica-rio', label: 'Arábica Rio', unit: 'saca 60 kg', value: cccv?.arabicaRio ?? null, changePct: null, source: 'CCCV', marketType: 'physical' },
      { id: 'conilon', label: 'Conilon 7/8', unit: 'saca 60 kg', value: cccv?.conilon ?? null, changePct: null, source: 'CCCV', marketType: 'physical' },
      { id: 'boi', label: 'Boi gordo', unit: 'arroba', value: incaper?.average ?? null, changePct: null, source: 'Incaper', marketType: 'physical', minimum: incaper?.minimum ?? null, maximum: incaper?.maximum ?? null, quoteDate: incaper?.quoteDate ?? null }
    ],
    futures: []
  };
}
