import { randomBytes, scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

export const DEFAULT_ADMIN_PASSWORD = '9999';

export interface AuthConfig {
  passwordHash: string;
  salt: string;
}

export async function hashPassword(password: string): Promise<AuthConfig> {
  const salt = randomBytes(16).toString('hex');
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return { passwordHash: derived.toString('hex'), salt };
}

export async function verifyPassword(password: string, config: AuthConfig): Promise<boolean> {
  const derived = (await scryptAsync(password, config.salt, 64)) as Buffer;
  const expected = Buffer.from(config.passwordHash, 'hex');
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

export async function createDefaultAuthConfig(): Promise<AuthConfig> {
  return hashPassword(DEFAULT_ADMIN_PASSWORD);
}
