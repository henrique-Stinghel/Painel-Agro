// Contrato preparado para a próxima etapa. O provedor licenciado deverá
// devolver itens neste formato sem substituir as cotações físicas existentes.
export function normalizeB3Quote({ id, label, value, changePct, unit, source, delayed = true }) {
  return { id, label, value: Number(value), changePct: Number(changePct), unit, source, delayed, marketType: 'futures' };
}

export async function getB3Snapshot() {
  return { items: [], updatedAt: null, status: 'provider-not-configured' };
}
