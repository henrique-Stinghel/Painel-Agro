import { NextResponse } from 'next/server';
import { createSessionToken, credentialsAreConfigured, passwordIsValid, SESSION_COOKIE, sessionCookieOptions } from '../../../../lib/auth';

export async function POST(request) {
  if (!credentialsAreConfigured()) {
    return NextResponse.json({ error: 'Configure as credenciais do administrador na Vercel.' }, { status: 503 });
  }
  const body = await request.json().catch(() => ({}));
  if (!passwordIsValid(body.password)) {
    return NextResponse.json({ error: 'Senha incorreta.' }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, createSessionToken(), sessionCookieOptions());
  return response;
}
