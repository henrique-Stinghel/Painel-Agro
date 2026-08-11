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
    .replace(/&Atilde;|&#195;/gi, 'Ã')
    .replace(/&eacute;|&#233;/gi, 'é')
    .replace(/&Eacute;|&#201;/gi, 'É')
    .replace(/&iacute;|&#237;/gi, 'í')
    .replace(/&Iacute;|&#205;/gi, 'Í')
    .replace(/&oacute;|&#243;/gi, 'ó')
    .replace(/&Oacute;|&#211;/gi, 'Ó')
    .replace(/&uacute;|&#250;/gi, 'ú')
    .replace(/&Uacute;|&#218;/gi, 'Ú');
}

function htmlToText(html) {
  return decodeHtml(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/\s+/g, ' ')
    .trim();
}

function brlToNumber(value) {
  if (!value) return null;

  const parsed = Number(
    value
      .replace(/\./g, '')
      .replace(',', '.')
      .replace(/[^\d.-]/g, '')
  );

  return Number.isFinite(parsed) ? parsed : null;
}

async function fetchCCCV() {
  const response = await fetch(CCCV_URL, {
    headers: {
      'User-Agent':
        'PainelAgroES/1.0 (+market-data; source attribution CCCV)',
    },
    next: {
      revalidate: 900,
    },
  });

  if (!response.ok) {
    throw new Error(CCCV respondeu ${response.status});
  }

  const html = await response.text();

  const rows = [...html.matchAll(/<tr[^>]>[\s\S]?<\/tr>/gi)];

  let latest = null;

  for (const rowMatch of rows) {
    const rowText = htmlToText(rowMatch[0]);

    const match = rowText.match(
      /^(\d{1,2})\s+([\d.]+,\d{2})\s+([\d.]+,\d{2})\s+([\d.]+,\d{2})$/
    );

    if (!match) continue;

    const candidate = {
      day: Number(match[1]),
      arabicaDura: brlToNumber(match[2]),
      arabicaRio: brlToNumber(match[3]),
      conilon: brlToNumber(match[4]),
    };

    if (
      candidate.arabicaDura !== null ||
      candidate.arabicaRio !== null ||
      candidate.conilon !== null
    ) {
      latest = candidate;
    }
  }

  if (!latest) {
    throw new Error(
      'Não foi possível localizar a última cotação no HTML da CCCV'
    );
  }

  return {
    quoteDate: Dia ${latest.day},
    arabicaDura: latest.arabicaDura,
    arabicaRio: latest.arabicaRio,
    conilon: latest.conilon,
  };
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
        {
          id: 'arabica-dura',
          label: 'Arábica Dura',
          unit: 'saca 60 kg',
          value: cccv.arabicaDura,
          changePct: null,
          source: 'CCCV',
        },
        {
          id: 'arabica-rio',
          label: 'Arábica Rio',
          unit: 'saca 60 kg',
          value: cccv.arabicaRio,
          changePct: null,
          source: 'CCCV',
        },
        {
          id: 'conilon',
          label: 'Conilon 7/8',
          unit: 'saca 60 kg',
          value: cccv.conilon,
          changePct: null,
          source: 'CCCV',
        },
        {
          id: 'boi',
          label: 'Boi gordo',
          unit: 'arroba',
          value: null,
          changePct: null,
          source: 'A definir',
        },
      ],
    };
  } catch (error) {
    return {
      source: 'CCCV — indisponível no momento',
      sourceUrl: CCCV_URL,
      quoteDate: null,
      updatedAt: new Date().toISOString(),
      error:
        error instanceof Error
          ? error.message
          : 'Falha ao consultar a CCCV',

      items: [
        {
          id: 'arabica-dura',
          label: 'Arábica Dura',
          unit: 'saca 60 kg',
          value: null,
          changePct: null,
          source: 'CCCV',
        },
        {
          id: 'arabica-rio',
          label: 'Arábica Rio',
          unit: 'saca 60 kg',
          value: null,
          changePct: null,
          source: 'CCCV',
        },
        {
          id: 'conilon',
          label: 'Conilon 7/8',
          unit: 'saca 60 kg',
          value: null,
          changePct: null,
          source: 'CCCV',
        },
        {
          id: 'boi',
          label: 'Boi gordo',
          unit: 'arroba',
          value: null,
          changePct: null,
          source: 'A definir',
        },
      ],
    };
  }
}
