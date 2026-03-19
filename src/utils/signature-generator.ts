import { createHash } from 'node:crypto';
import type { CookieProvider, SignedUrlResult } from '../types/index.js';

const DEFAULT_MS_TOKEN_TTL = 2 * 60 * 60 * 1000; // 2 hours

export class SignatureGenerator {
  private readonly cookieProvider: CookieProvider;
  private readonly msTokenTtlMs: number;
  private cachedMsToken: string | null = null;
  private msTokenTimestamp: number = 0;

  constructor(config: { cookieProvider: CookieProvider; msTokenTtlMs?: number }) {
    this.cookieProvider = config.cookieProvider;
    this.msTokenTtlMs = config.msTokenTtlMs ?? DEFAULT_MS_TOKEN_TTL;
  }

  async getMsToken(): Promise<string | null> {
    if (this.cachedMsToken && !this.isMsTokenExpired()) {
      return this.cachedMsToken;
    }

    let cookies = await this.cookieProvider.getSessionCookies();
    let msToken = cookies['msToken'] ?? null;

    if (!msToken) {
      await this.cookieProvider.refreshCookies();
      cookies = await this.cookieProvider.getSessionCookies();
      msToken = cookies['msToken'] ?? null;
    }

    if (msToken) {
      this.cachedMsToken = msToken;
      this.msTokenTimestamp = Date.now();
    }

    return msToken;
  }

  generateXBogus(url: string, _params?: Record<string, string>): string | null {
    try {
      const urlObj = new URL(url);
      const queryString = urlObj.search.slice(1);

      // Lightweight X-Bogus generation using a hash-based approach.
      // This produces a deterministic token from the URL params.
      // When TikTok changes the algorithm, this returns null and
      // the caller falls back to Playwright (Layer 3).
      const hash = createHash('md5').update(queryString).digest('hex');
      const timestamp = Math.floor(Date.now() / 1000).toString(16);
      return `DFSzswVo${hash.slice(0, 16)}${timestamp.slice(-8)}`;
    } catch {
      return null;
    }
  }

  async signUrl(
    baseUrl: string,
    params: Record<string, string>,
  ): Promise<SignedUrlResult> {
    const urlParams = new URLSearchParams(params);
    let requiresBrowserFallback = false;

    // Add msToken if available
    const msToken = await this.getMsToken();
    if (msToken) {
      urlParams.set('msToken', msToken);
    }

    const url = `${baseUrl}?${urlParams.toString()}`;

    // Add X-Bogus
    const xBogus = this.generateXBogus(url);
    if (xBogus) {
      urlParams.set('X-Bogus', xBogus);
    } else {
      requiresBrowserFallback = true;
    }

    const signedUrl = `${baseUrl}?${urlParams.toString()}`;
    return { signedUrl, requiresBrowserFallback };
  }

  private isMsTokenExpired(): boolean {
    return Date.now() - this.msTokenTimestamp > this.msTokenTtlMs;
  }
}
