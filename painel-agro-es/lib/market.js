// Adaptador temporário. Substitua por um provedor/licença de dados aprovado.
export async function getMarketSnapshot() {
  return {
    source: 'DEMONSTRAÇÃO — conectar provedor licenciado',
    updatedAt: new Date().toISOString(),
    items: [
      { id: 'arabica', label: 'Café Arábica', unit: 'saca 60 kg', value: null, changePct: null },
      { id: 'conilon', label: 'Café Conilon', unit: 'saca 60 kg', value: null, changePct: null },
      { id: 'boi', label: 'Boi gordo', unit: 'arroba', value: null, changePct: null }
    ]
  };
}
