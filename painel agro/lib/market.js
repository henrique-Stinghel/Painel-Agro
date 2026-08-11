const CCCV_URL = 'https://www.cccv.org.br/cotacao/';

function decodeHtml(text) {
  return text
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&amp;/gi, '&')
    .replace(/&ccedil;|&#231;/gi, 'ç')
    .replace(/&Ccedil;|&#199;/gi, 'Ç')
    .replace(/&aacute;|&#225;/gi, 'á')
    .replace(/&Aacute;|&#193;/gi, 'Á')
    .replace(/&atilde;|&#227;/gi, 'ã')
    .replace(/&Atilde;|&#195;/gi, 'Ã');
}

function htmlToText(html) {
  return decodeHtml(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  ).replace(/\s+/g, ' ').trim();
}

function brlToNumber(value) {
  if (!value) return null;
  const parsed = Number(value.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function firstPrice(text, pattern) {
  const match = text.match(pattern);
  return brlToNumber(match?.[1]);
}

async function fetchCCCV() {
  const response = await fetch(CCCV_URL, {
    headers: {
      'User-Agent': 'PainelAgroES/1.0 (+market-data; source attribution CCCV)'
    },
    next: { revalidate: 900 }
  });

  if (!response.ok) {
    throw new Error(`CCCV respondeu ${response.status}`);
  }

  const html = await response.text();
  const text = htmlToText(html);

  const quoteDate = text.match(/Arábica\s+(\d{1,2}\s+[A-ZÇ]{3}\s+\d{4})/i)?.[1] || null;
  const arabicaDura = firstPrice(
    text,
    /Bebida\s*["“]?dura["”]?[\s\S]{0,320}?R\$\s*([\d.]+,\d{2})/i
  );
  const arabicaRio = firstPrice(
    text,
    /Bebida\s*["“]?rio["”]?[\s\S]{0,320}?R\$\s*([\d.]+,\d{2})/i
  );
  const conilon = firstPrice(
    text,
    /Conilon[\s\S]{0,500}?Bica\s+corrida[\s\S]{0,350}?R\$\s*([\d.]+,\d{2})/i
  );

  if (arabicaDura == null && arabicaRio == null && conilon == null) {
    throw new Error('Não foi possível localizar as cotações no HTML da CCCV.');
  }

  return { quoteDate, arabicaDura, arabicaRio, conilon };
}

export async function getMarketSnapshot() {
  try {
    const cccv = await fetchCCCV();
    return {
      source: 'CCCV — Centro do Comércio de Café de Vitória',
      sourceUrl: CCCV_URL,
      quoteDate: cccv.quoteDate,
      updatedAt: new Date().toISOString(),
      items: [
        { id: 'arabica-dura', label: 'Arábica Dura', unit: 'saca 60 kg', value: cccv.arabicaDura, changePct: null, source: 'CCCV' },
        { id: 'arabica-rio', label: 'Arábica Rio', unit: 'saca 60 kg', value: cccv.arabicaRio, changePct: null, source: 'CCCV' },
        { id: 'conilon', label: 'Conilon 7/8', unit: 'saca 60 kg', value: cccv.conilon, changePct: null, source: 'CCCV' },
        { id: 'boi', label: 'Boi gordo', unit: 'arroba', value: null, changePct: null, source: 'A definir' }
      ]
    };
  } catch (error) {
    return {
      source: 'CCCV — indisponível no momento',
      sourceUrl: CCCV_URL,
      quoteDate: null,
      updatedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Falha ao consultar a CCCV.',
      items: [
        { id: 'arabica-dura', label: 'Arábica Dura', unit: 'saca 60 kg', value: null, changePct: null, source: 'CCCV' },
        { id: 'arabica-rio', label: 'Arábica Rio', unit: 'saca 60 kg', value: null, changePct: null, source: 'CCCV' },
        { id: 'conilon', label: 'Conilon 7/8', unit: 'saca 60 kg', value: null, changePct: null, source: 'CCCV' },
        { id: 'boi', label: 'Boi gordo', unit: 'arroba', value: null, changePct: null, source: 'A definir' }
      ]
    };
  }
}
