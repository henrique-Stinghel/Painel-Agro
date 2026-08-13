'use client';

import { useState } from 'react';

export default function LoginForm() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true); setError('');
    const response = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
    const data = await response.json().catch(() => ({}));
    if (response.ok) window.location.reload();
    else { setError(data.error || 'Não foi possível entrar.'); setLoading(false); }
  }

  return (
    <section className="loginCard">
      <a href="/" className="backLink">← Voltar ao Painel Agro ES</a>
      <small>ÁREA RESTRITA</small>
      <h1>Gerenciar anúncios</h1>
      <p>Entre para cadastrar e programar as propagandas do site.</p>
      <form onSubmit={submit}>
        <label>Senha<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required autoFocus /></label>
        {error && <div className="formError">{error}</div>}
        <button disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
      </form>
    </section>
  );
}
