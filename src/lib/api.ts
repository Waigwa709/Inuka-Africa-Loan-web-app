/**
 * Centralized API client for the Inuka Africa backend.
 *
 * - Attaches the bearer token from localStorage to every request.
 * - On 401 responses, clears the session and reloads so the login screen shows.
 */

const TOKEN_KEY = 'inuka_auth_token';
const USER_KEY = 'inuka_auth_user';

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers || {});
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const token = getAuthToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  const res = await fetch(input, { ...init, headers });
  if (res.status === 401 && !input.includes('/api/auth/')) {
    clearAuthSession();
    window.location.reload();
  }
  return res;
}
