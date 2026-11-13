import crypto from 'crypto';
import pool from './db';

/**
 * Server-side authentication for the Inuka Africa tracker.
 *
 * - Passwords are hashed with Node's built-in scrypt (salted, memory-hard KDF).
 * - Sessions are stateless HMAC-SHA256 signed tokens (no server-side session store).
 * - The signing secret comes from AUTH_SECRET; if unset, a random per-boot secret
 *   is generated (tokens are invalidated on restart, which is safe for development).
 */

const TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

function getSecret(): string {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  if (!getSecret.cached) {
    getSecret.cached = crypto.randomBytes(32).toString('hex');
    console.warn('[auth] AUTH_SECRET not set — using a random per-boot secret. Set AUTH_SECRET in .env for stable sessions.');
  }
  return getSecret.cached;
}
getSecret.cached = '' as string;

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.split(':');
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
}

function signToken(user: AuthUser): string {
  const payload = Buffer.from(
    JSON.stringify({ sub: user.id, email: user.email, name: user.fullName, role: user.role, exp: Date.now() + TOKEN_TTL_MS })
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', getSecret()).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyToken(token: string): AuthUser | null {
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const expected = crypto.createHmac('sha256', getSecret()).update(payload).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!data.exp || data.exp < Date.now()) return null;
    return { id: data.sub, email: data.email, fullName: data.name, role: data.role };
  } catch {
    return null;
  }
}

export async function ensureUsersTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      phone VARCHAR(50) NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'admin',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

export async function countUsers(): Promise<number> {
  const [rows] = await pool.query('SELECT COUNT(*) AS n FROM users') as any;
  return Number(rows[0].n);
}

export async function createUser(email: string, password: string, fullName: string, phone?: string, role = 'admin'): Promise<AuthUser> {
  const id = `usr-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  await pool.query(
    'INSERT INTO users (id, email, password_hash, full_name, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
    [id, email.toLowerCase().trim(), hashPassword(password), fullName.trim(), phone || null, role]
  );
  return { id, email: email.toLowerCase().trim(), fullName, role };
}

export async function findUserByEmail(email: string): Promise<(AuthUser & { passwordHash: string }) | null> {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]) as any;
  if (!rows.length) return null;
  const r = rows[0];
  return { id: r.id, email: r.email, fullName: r.full_name, role: r.role, passwordHash: r.password_hash };
}

export async function authenticate(email: string, password: string): Promise<{ user: AuthUser; token: string } | null> {
  const user = await findUserByEmail(email);
  if (!user || !verifyPassword(password, user.passwordHash)) return null;
  const { passwordHash, ...authUser } = user;
  return { user: authUser, token: signToken(authUser) };
}

export function issueToken(user: AuthUser): string {
  return signToken(user);
}
