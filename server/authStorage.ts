import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { get, put } from '@vercel/blob';
import {
  createDefaultAuthConfig,
  type AuthConfig,
  verifyPassword,
} from './authCrypto.js';
import { useBlobStorage } from './blobStorage.js';
import { isVercelRuntime } from './vercelEnv.js';

const AUTH_BLOB_PATH = 'church-finance-auth.json';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCAL_AUTH_PATH = path.join(__dirname, '..', 'data', 'auth.json');

async function loadAuthFromBlob(): Promise<AuthConfig | null> {
  try {
    const result = await get(AUTH_BLOB_PATH, { access: 'private' });
    if (!result || result.statusCode !== 200 || !result.stream) return null;
    const text = await new Response(result.stream).text();
    return JSON.parse(text) as AuthConfig;
  } catch {
    return null;
  }
}

async function saveAuthToBlob(config: AuthConfig): Promise<void> {
  await put(AUTH_BLOB_PATH, JSON.stringify(config), {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
  });
}

function loadAuthFromFile(): AuthConfig | null {
  try {
    if (!fs.existsSync(LOCAL_AUTH_PATH)) return null;
    return JSON.parse(fs.readFileSync(LOCAL_AUTH_PATH, 'utf8')) as AuthConfig;
  } catch {
    return null;
  }
}

function saveAuthToFile(config: AuthConfig): void {
  const dir = path.dirname(LOCAL_AUTH_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(LOCAL_AUTH_PATH, JSON.stringify(config), 'utf8');
}

export async function getAuthConfig(): Promise<AuthConfig> {
  if (useBlobStorage()) {
    const fromBlob = await loadAuthFromBlob();
    if (fromBlob?.passwordHash && fromBlob?.salt) return fromBlob;
    const seeded = await createDefaultAuthConfig();
    await saveAuthToBlob(seeded);
    return seeded;
  }

  const fromFile = loadAuthFromFile();
  if (fromFile?.passwordHash && fromFile?.salt) return fromFile;

  const seeded = await createDefaultAuthConfig();
  saveAuthToFile(seeded);
  return seeded;
}

export async function setAuthConfig(config: AuthConfig): Promise<void> {
  if (useBlobStorage()) {
    await saveAuthToBlob(config);
    return;
  }
  saveAuthToFile(config);
}

export async function checkPassword(password: string): Promise<boolean> {
  const config = await getAuthConfig();
  return verifyPassword(password, config);
}
