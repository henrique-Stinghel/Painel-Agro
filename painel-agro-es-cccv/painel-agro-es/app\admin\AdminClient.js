'use client';

import { useEffect, useState } from 'react';

const EMPTY = { companyName: '', callToAction: '', imageUrl: '', targetUrl: '', position: 'topo', startsAt: '', endsAt: '', active: true };
const POSITION_LABELS = { topo: 'Acima das cotações', 'entre-cotacoes-clima': 'Entre cotações e clima', 'antes-radar': 'Antes do Radar' };

function toForm(ad) {
  const local = (value) => value ? new Date(value).toISOString().slice(0, 16) : '';
  return { companyName: ad.company_name, callToAction: ad.call_to_action, imageUrl: ad.image_url, targetUrl: ad.target_url, position: ad.position, startsAt: local(ad.starts_at), endsAt: local(ad.ends_at), active: ad.active };
}

export default function AdminClient() {
  const [ads, setAds] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState('Carregando anúncios...');
  const [saving, setSaving] = useState(false);

  async function load() {
    const response = await fetch('/api/admin/ads', { cache: 'no-store' });
    const data = await response.json().catch(() => ({}));
    if (response.ok) { setAds(data.items || []); setStatus(''); }
    else setStatus(data.error || 'Não foi possível carregar os anúncios.');
  }
  useEffect(() => { load(); }, []);
  function set(name, value) { setForm((current) => ({ ...current, [name]: value })); }

  async function upload(file) {
    if (!file) return;
    setStatus('Enviando imagem...');
    const body = new FormData(); body.append('image', file);
    const response = await fetch('/api/admin/upload', { method: 'POST', body });
    const data = await response.json().catch(() => ({}));
    if (response.ok) { set('imageUrl', data.url); setStatus('Imagem pronta.'); }
    else setStatus(data.error || 'Falha ao enviar a imagem.');
  }

  async function save(event) {
    event.preventDefault(); setSaving(true); setStatus('Salvando...');
    const response = await fetch(editingId ? `/api/admin/ads/${editingId}` : '/api/admin/ads', {
      method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok) { setForm(EMPTY); setEditingId(null); setStatus('Anúncio salvo.'); await load(); }
    else setStatus(data.error || 'Não foi possível salvar.');
    setSaving(false);
  }

  async function remove(ad) {
    if (!window.confirm(`Excluir o anúncio de ${ad.company_name}?`)) return;
    const response = await fetch(`/api/admin/ads/${ad.id}`, { method: 'DELETE' });
    const data = await response.json().catch(() => ({}));
    setStatus(response.ok ? 'Anúncio excluído.' : data.error || 'Não foi possível excluir.');
    if (response.ok) await load();
  }

  async function toggle(ad) {
    const response = await fetch(`/api/admin/ads/${ad.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...toForm(ad), active: !ad.active }) });
    if (response.ok) await load();
  }

  async function logout() { await fetch('/api/admin/logout', { method: 'POST' }); window.location.reload(); }

  return (
    <>
      <header className="adminHeader"><div><small>PAINEL ADMINISTRATIVO</small><h1>Anúncios</h1><p>Cadastre, programe e controle as propagandas exibidas no site.</p></div><div className="adminActions"><a href="/">Ver site</a><button onClick={logout}>Sair</button></div></header>
      <section className="adminGrid">
        <form className="adForm" onSubmit={save}>
          <h2>{editingId ? 'Editar anúncio' : 'Novo anúncio'}</h2>
          <label>Empresa<input value={form.companyName} onChange={(e) => set('companyName', e.target.value)} required /></label>
          <label>Texto ou chamada<textarea value={form.callToAction} onChange={(e) => set('callToAction', e.target.value)} required rows="3" /></label>
          <label>Imagem<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(e) => upload(e.target.files?.[0])} /></label>
          {form.imageUrl && <img className="adminPreview" src={form.imageUrl} alt="Prévia do anúncio" />}
          <label>WhatsApp ou URL<input type="url" placeholder="https://wa.me/..." value={form.targetUrl} onChange={(e) => set('targetUrl', e.target.value)} required /></label>
          <label>Posição<select value={form.position} onChange={(e) => set('position', e.target.value)}>{Object.entries(POSITION_LABELS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
          <div className="dateGrid"><label>Início<input type="datetime-local" value={form.startsAt} onChange={(e) => set('startsAt', e.target.value)} /></label><label>Fim<input type="datetime-local" value={form.endsAt} onChange={(e) => set('endsAt', e.target.value)} /></label></div>
          <label className="checkLabel"><input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} /> Anúncio ativo</label>
          <div className="formButtons"><button disabled={saving || !form.imageUrl}>{saving ? 'Salvando...' : 'Salvar anúncio'}</button>{editingId && <button type="button" className="secondary" onClick={() => { setEditingId(null); setForm(EMPTY); }}>Cancelar</button>}</div>
          {status && <div className="formStatus">{status}</div>}
        </form>
        <section className="adList"><div className="listTitle"><h2>Anúncios cadastrados</h2><span>{ads.length}</span></div>{!status && ads.length === 0 && <div className="emptyState">Nenhum anúncio cadastrado ainda.</div>}{ads.map((ad) => <article className="adminAd" key={ad.id}><img src={ad.image_url} alt="" /><div><div className="adBadges"><span className={ad.active ? 'activeBadge' : 'inactiveBadge'}>{ad.active ? 'Ativo' : 'Inativo'}</span><span>{POSITION_LABELS[ad.position]}</span></div><h3>{ad.company_name}</h3><p>{ad.call_to_action}</p><div className="rowActions"><button onClick={() => toggle(ad)}>{ad.active ? 'Desativar' : 'Ativar'}</button><button onClick={() => { setEditingId(ad.id); setForm(toForm(ad)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Editar</button><button className="danger" onClick={() => remove(ad)}>Excluir</button></div></div></article>)}</section>
      </section>
    </>
  );
}
