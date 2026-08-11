const CCCV_URL = 'https://www.cccv.org.br/cotacao/';
const INCAPER_URL = 'https://incaper.es.gov.br/mercado-agricola';

function decodeHtml(text) {
  return String(text || '')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&amp;/gi, '&')
    .replace(/&ccedil;|&#231;/gi, 'ç')
    .replace(/&Ccedil;|&#199;/gi, 'Ç')
    .replace(/&aacute;|&#225;/gi, 'á')
    .replace(/&Aacute;|&#193;/gi, 'Á')
    .replace(/&atilde;|&#227;/gi, 'ã')
    .replace(/&Atilde;|&#195;/gi, 'Ã')
    .replace(/&eacute;|&#233;/gi, 'é')
    .replace(/&Eacute;|&#201;/gi, 'É')
    .replace(/&iacute;|&#237;/gi, 'í')
    .replace(/&Iacute;|&#205;/gi, 'Í')
    .replace(/&oacute;|&#243;/gi, 'ó')
    .replace(/&Oacute;|&#211;/gi, 'Ó')
    .replace(/&uacute;|&#250;/gi, 'ú')
    .replace(/&Uacute;|&#218;/gi, 'Ú')
    .replace(/&#(\d+);/g, function (_, code) {
      return String.fromCharCode(Number(code));
    });
}

function htmlToText(html) {
  return decodeHtml(
    String(html || '')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<\/td>/gi, ' ')
      .replace(/<\/th>/gi, ' ')
      .replace(/<\/tr>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/\s+/g, ' ')
    .trim();
}

function brToNumber(value) {
  if (!value) return null;

  const parsed = Number(
    String(value)
      .replace(/\./g, '')
      .replace(',', '.')
      .replace(/[^\d.-]/g, '')
  );

  return Number.isFinite(parsed) ? parsed : null;
}

/* =========================
   CAFÉ - CCCV
========================= */

async function fetchCCCV() {
  const response = await fetch(CCCV_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 PainelAgroES/1.0',
      Accept: 'text/html,application/xhtml+xml'
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error('CCCV respondeu ' + response.status);
  }

  const html = await response.text();
  const text = htmlToText(html);

  const regex =
    /(?:^|\s)(\d{1,2})\s+([\d.]+,\d{2})\s+([\d.]+,\d{2})\s+([\d.]+,\d{2})(?=\s|$)/g;

  let match;
  let latest = null;

  while ((match = regex.exec(text)) !== null) {
    const day = Number(match[1]);

    if (day < 1 || day > 31) {
      continue;
    }

    latest = {
      day: day,
      arabicaDura: brToNumber(match[2]),
      arabicaRio: brToNumber(match[3]),
      conilon: brToNumber(match[4])
    };
  }

  if (!latest) {
    throw new Error(
      'Não foi possível localizar os preços no conteúdo recebido da CCCV'
    );
  }

  return {
    quoteDate: 'Dia ' + latest.day,
    arabicaDura: latest.arabicaDura,
    arabicaRio: latest.arabicaRio,
    conilon: latest.conilon
  };
}

/* =========================
   BOI GORDO - INCAPER
========================= */

async function fetchIncaper() {
  const response = await fetch(INCAPER_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 PainelAgroES/1.0',
      Accept: 'text/html,application/xhtml+xml'
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error('Incaper respondeu ' + response.status);
  }

  const html = await response.text();
  const text = htmlToText(html);

  const dateMatch = text.match(
    /Preço recebido pelo produtor\s+(\d{2}\/\d{2}\/\d{4})/i
  );

  const boiMatch = text.match(
    /Boi Gordo Castrado\s+R\$\s*([\d.]+,\d{2})\s+R\$\s*([\d.]+,\d{2})\s+R\$\s*([\d.]+,\d{2})/i
  );

  if (!boiMatch) {
    throw new Error(
      'Não foi possível localizar a cotação do boi no Incaper'
    );
  }

  return {
    quoteDate: dateMatch ? dateMatch[1] : null,
    minimum: brToNumber(boiMatch[1]),
    average: brToNumber(boiMatch[2]),
    maximum: brToNumber(boiMatch[3])
  };
}

/* =========================
   SNAPSHOT FINAL
========================= */

export async function getMarketSnapshot() {
  let cccv = null;
  let incaper = null;
  let cccvError = null;
  let incaperError = null;

  try {
    cccv = await fetchCCCV();
  } catch (error) {
    cccvError =
      error instanceof Error
        ? error.message
        : 'Falha ao consultar a CCCV';
  }

  try {
    incaper = await fetchIncaper();
  } catch (error) {
    incaperError =
      error instanceof Error
        ? error.message
        : 'Falha ao consultar o Incaper';
  }

  return {
    source:
      cccv || incaper
        ? 'CCCV + Incaper'
        : 'Fontes indisponíveis no momento',

    sourceUrl: CCCV_URL,

    quoteDate: cccv
      ? cccv.quoteDate
      : incaper
        ? incaper.quoteDate
        : null,

    updatedAt: new Date().toISOString(),

    errors: {
      cccv: cccvError,
      incaper: incaperError
    },

    items: [
      {
        id: 'arabica-dura',
        label: 'Arábica Dura',
        unit: 'saca 60 kg',
        value: cccv ? cccv.arabicaDura : null,
        changePct: null,
        source: 'CCCV'
      },

      {
        id: 'arabica-rio',
        label: 'Arábica Rio',
        unit: 'saca 60 kg',
        value: cccv ? cccv.arabicaRio : null,
        changePct: null,
        source: 'CCCV'
      },

      {
        id: 'conilon',
        label: 'Conilon 7/8',
        unit: 'saca 60 kg',
        value: cccv ? cccv.conilon : null,
        changePct: null,
        source: 'CCCV'
      },

      {
        id: 'boi',
        label: 'Boi gordo',
        unit: 'arroba',
        value: incaper ? incaper.average : null,
        changePct: null,
        source: 'Incaper',
        minimum: incaper ? incaper.minimum : null,
        maximum: incaper ? incaper.maximum : null,
        quoteDate: incaper ? incaper.quoteDate : null
      }
    ]
  };
}
