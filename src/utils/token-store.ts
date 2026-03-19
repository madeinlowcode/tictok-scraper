import type { TokenStore } from '../types/index.js';

const DEFAULT_MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes

export function createTokenStore(cookies: Record<string, string>): TokenStore {
  return {
    ttWebId: cookies['tt_webid'] ?? undefined,
    msToken: cookies['msToken'] ?? undefined,
    ttChainToken: cookies['tt_chain_token'] ?? undefined,
    ttwid: cookies['ttwid'] ?? undefined,
    cookies,
    extractedAt: Date.now(),
  };
}

export function isTokenStoreValid(
  store: TokenStore,
  maxAgeMs: number = DEFAULT_MAX_AGE_MS,
): boolean {
  return Date.now() - store.extractedAt < maxAgeMs;
}

export function tokensToCookieHeader(store: TokenStore): string {
  const parts: string[] = [];

  for (const [name, value] of Object.entries(store.cookies)) {
    parts.push(`${name}=${value}`);
  }

  return parts.join('; ');
}
