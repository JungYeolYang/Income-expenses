import { hashPassword, verifyPassword } from './authCrypto.js';
import { checkPassword, getAuthConfig, setAuthConfig } from './authStorage.js';
import { isAuthenticatedRequest } from './session.js';

export class AuthError extends Error {
  constructor(
    message: string,
    readonly code: 'UNAUTHORIZED' | 'INVALID_PASSWORD' | 'WEAK_PASSWORD' | 'SAME_PASSWORD',
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export function assertAuthenticated(cookieHeader: string | undefined): void {
  if (!isAuthenticatedRequest(cookieHeader)) {
    throw new AuthError('로그인이 필요합니다.', 'UNAUTHORIZED');
  }
}

export async function handleAuthSession(cookieHeader: string | undefined): Promise<{ authenticated: boolean }> {
  return { authenticated: isAuthenticatedRequest(cookieHeader) };
}

export async function handleAuthLogin(password: unknown): Promise<void> {
  if (typeof password !== 'string' || !password) {
    throw new AuthError('비밀번호를 입력하세요.', 'INVALID_PASSWORD');
  }
  const ok = await checkPassword(password);
  if (!ok) throw new AuthError('비밀번호가 올바르지 않습니다.', 'INVALID_PASSWORD');
}

export async function handleAuthChangePassword(
  cookieHeader: string | undefined,
  body: unknown,
): Promise<void> {
  assertAuthenticated(cookieHeader);
  const { currentPassword, newPassword } = (body ?? {}) as {
    currentPassword?: string;
    newPassword?: string;
  };
  if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
    throw new AuthError('현재 비밀번호와 새 비밀번호를 입력하세요.', 'INVALID_PASSWORD');
  }
  if (newPassword.length < 4) {
    throw new AuthError('새 비밀번호는 4자 이상이어야 합니다.', 'WEAK_PASSWORD');
  }
  if (currentPassword === newPassword) {
    throw new AuthError('새 비밀번호가 현재와 같습니다.', 'SAME_PASSWORD');
  }
  const config = await getAuthConfig();
  const valid = await verifyPassword(currentPassword, config);
  if (!valid) throw new AuthError('현재 비밀번호가 올바르지 않습니다.', 'INVALID_PASSWORD');
  await setAuthConfig(await hashPassword(newPassword));
}
