import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

export const SESSION_COOKIE = 'painel_agro_admin';
const SESSION_AGE = 60 * 60 * 12;

function safeEqual(left, right) {
  const a = Buffer.from(String(left || ''));
  const b = Buffer.from(String(right || ''));
  return a.length === b.length && timingSafeEqual(a, b);
}

function signature(payload) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return '';
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function credentialsAreConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_SESSION_SECRET);
}

export function passwordIsValid(password) {
  return credentialsAreConfigured() && safeEqual(password, process.env.ADMIN_PASSWORD);
}

export function createSessionToken() {
  const expires = Math.floor(Date.now() / 1000) + SESSION_AGE;
  const payload = `admin.${expires}`;
  return `${payload}.${signature(payload)}`;
}

export function sessionTokenIsValid(token) {
  if (!token || !credentialsAreConfigured()) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const payload = `${parts[0]}.${parts[1]}`;
  return parts[0] === 'admin' && Number(parts[1]) > Date.now() / 1000 && safeEqual(parts[2], signature(payload));
}

export async function isAdmin() {
  const store = await cookies();
  return sessionTokenIsValid(store.get(SESSION_COOKIE)?.value);
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_AGE
  };
}
