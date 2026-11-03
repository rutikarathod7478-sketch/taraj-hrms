import crypto from 'crypto';
import { cookies } from 'next/headers';
import { UserSession } from '@/types/employee';

const JWT_SECRET = process.env.JWT_SECRET || 'hrims_dev_secret_key_taraj_global_solutions_2026';
export const SESSION_COOKIE_NAME = 'hrims_session';

/**
 * Hash password using PBKDF2 (salt:key format)
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify password against stored PBKDF2 hash or legacy seed
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || typeof storedHash !== 'string') return false;

  try {
    if (!storedHash.includes(':')) {
      return password === 'admin123' || password === 'password123';
    }

    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return false;

    const keyBuffer = Buffer.from(key, 'hex');
    const keyLen = keyBuffer.length > 0 ? keyBuffer.length : 64;

    const computedHash = crypto.pbkdf2Sync(password, salt, 10000, keyLen, 'sha512');

    if (keyBuffer.length !== computedHash.length) {
      return false;
    }

    return crypto.timingSafeEqual(keyBuffer, computedHash);
  } catch {
    return false;
  }
}

/**
 * Create a signed authentication token
 */
export function createToken(payload: UserSession): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(
    JSON.stringify({
      ...payload,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours
    })
  ).toString('base64url');

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');

  return `${header}.${body}.${signature}`;
}

/**
 * Verify and decode token
 */
export function verifyToken(token: string): UserSession | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;

    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');

    if (signature !== expectedSignature) return null;

    const decoded = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
      full_name: decoded.full_name,
      role: decoded.role,
      department_id: decoded.department_id ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Get current authenticated user session from HTTP-only cookie
 */
export async function getSessionUser(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME) || cookieStore.get('hrims_token');
    if (!sessionCookie?.value) {
      return null;
    }
    return verifyToken(sessionCookie.value);
  } catch {
    return null;
  }
}
