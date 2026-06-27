import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { HttpStatus, Injectable } from '@nestjs/common';
import { ApiError } from '../shared/api-error.js';

const scrypt = promisify(scryptCallback);
const HASH_PREFIX = 'scrypt';
const KEY_LENGTH = 64;
const DEFAULT_SESSION_TTL_MINUTES = 8 * 60;
const MAX_FAILED_LOGINS = 5;
const LOGIN_BACKOFF_MS = 5 * 60 * 1000;

interface LoginAttempt {
  count: number;
  blockedUntil: number;
}

interface AdminTokenPayload {
  actor: string;
  iat: number;
  exp: number;
}

@Injectable()
export class AdminAuthService {
  private readonly attempts = new Map<string, LoginAttempt>();

  async login(password: unknown, key: string) {
    if (typeof password !== 'string' || password.length === 0) {
      throw new ApiError('INVALID_PARAMETER', 'password is required', HttpStatus.BAD_REQUEST);
    }

    this.assertNotBlocked(key);
    const ok = await verifyAdminPassword(password);
    if (!ok) {
      this.recordFailure(key);
      throw new ApiError('INVALID_CREDENTIALS', 'Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    this.attempts.delete(key);
    const expiresInMinutes = getSessionTtlMinutes();
    return {
      token: signToken({
        actor: 'admin',
        iat: unixNow(),
        exp: unixNow() + expiresInMinutes * 60,
      }),
      expiresInMinutes,
    };
  }

  verifyAuthorizationHeader(value: string | undefined): AdminTokenPayload {
    if (!value?.startsWith('Bearer ')) {
      throw new ApiError('UNAUTHORIZED', 'Admin token is required', HttpStatus.UNAUTHORIZED);
    }

    const token = value.slice('Bearer '.length).trim();
    const payload = verifyToken(token);
    if (payload.exp <= unixNow()) {
      throw new ApiError('TOKEN_EXPIRED', 'Admin token expired', HttpStatus.UNAUTHORIZED);
    }
    return payload;
  }

  private assertNotBlocked(key: string) {
    const attempt = this.attempts.get(key);
    if (!attempt) return;

    if (attempt.blockedUntil > Date.now()) {
      throw new ApiError(
        'TOO_MANY_ATTEMPTS',
        'Too many login attempts',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (attempt.blockedUntil > 0) {
      this.attempts.delete(key);
    }
  }

  private recordFailure(key: string) {
    const current = this.attempts.get(key) ?? { count: 0, blockedUntil: 0 };
    const count = current.count + 1;
    this.attempts.set(key, {
      count,
      blockedUntil: count >= MAX_FAILED_LOGINS ? Date.now() + LOGIN_BACKOFF_MS : 0,
    });
  }
}

export async function hashAdminPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('base64url');
  const hash = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  return `${HASH_PREFIX}:${salt}:${hash.toString('base64url')}`;
}

async function verifyAdminPassword(password: string): Promise<boolean> {
  const configured = process.env.ADMIN_PASSWORD_HASH;
  if (!configured) {
    throw new ApiError(
      'ADMIN_AUTH_NOT_CONFIGURED',
      'Admin auth is not configured',
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }

  const [scheme, salt, expected] = configured.split(':');
  if (scheme !== HASH_PREFIX || !salt || !expected) {
    throw new ApiError(
      'ADMIN_AUTH_NOT_CONFIGURED',
      'Admin password hash is invalid',
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }

  const actual = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  const expectedBuffer = Buffer.from(expected, 'base64url');
  return actual.length === expectedBuffer.length && timingSafeEqual(actual, expectedBuffer);
}

function signToken(payload: AdminTokenPayload) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${encodedPayload}.${signatureFor(encodedPayload)}`;
}

function verifyToken(token: string): AdminTokenPayload {
  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) {
    throw new ApiError('INVALID_TOKEN', 'Invalid admin token', HttpStatus.UNAUTHORIZED);
  }

  const expected = signatureFor(encodedPayload);
  const actualBuffer = Buffer.from(signature, 'base64url');
  const expectedBuffer = Buffer.from(expected, 'base64url');
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    throw new ApiError('INVALID_TOKEN', 'Invalid admin token', HttpStatus.UNAUTHORIZED);
  }

  const parsed = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as Partial<AdminTokenPayload>;
  if (parsed.actor !== 'admin' || typeof parsed.iat !== 'number' || typeof parsed.exp !== 'number') {
    throw new ApiError('INVALID_TOKEN', 'Invalid admin token', HttpStatus.UNAUTHORIZED);
  }

  return { actor: parsed.actor, iat: parsed.iat, exp: parsed.exp };
}

function signatureFor(encodedPayload: string) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new ApiError(
      'ADMIN_AUTH_NOT_CONFIGURED',
      'Admin session secret is not configured',
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
  return createHmac('sha256', secret).update(encodedPayload).digest('base64url');
}

function getSessionTtlMinutes() {
  const raw = process.env.ADMIN_SESSION_TTL_MINUTES;
  if (!raw) return DEFAULT_SESSION_TTL_MINUTES;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_SESSION_TTL_MINUTES;
}

function unixNow() {
  return Math.floor(Date.now() / 1000);
}
