import { gotScraping } from 'got-scraping';
import { TIKTOK_BASE_URL, WEB_HEADERS } from '../config/constants.js';

export class CookieManager {
  private cookies: Record<string, string> = {};
  private lastRefresh: number = 0;
  private readonly ttlMs: number;

  constructor(ttlMs: number = 30 * 60 * 1000) {
    this.ttlMs = ttlMs;
  }

  async getSessionCookies(): Promise<Record<string, string>> {
    if (this.isExpired()) {
      await this.refreshCookies();
    }
    return { ...this.cookies };
  }

  async refreshCookies(): Promise<void> {
    const response = await gotScraping({
      url: TIKTOK_BASE_URL,
      headers: WEB_HEADERS,
      throwHttpErrors: false,
    });

    const setCookieHeaders = response.headers['set-cookie'];
    if (setCookieHeaders) {
      const cookieArray = Array.isArray(setCookieHeaders)
        ? setCookieHeaders
        : [setCookieHeaders];

      this.cookies = {};
      for (const cookie of cookieArray) {
        const [nameValue] = cookie.split(';');
        if (nameValue) {
          const eqIndex = nameValue.indexOf('=');
          if (eqIndex > 0) {
            const name = nameValue.slice(0, eqIndex).trim();
            const value = nameValue.slice(eqIndex + 1).trim();
            this.cookies[name] = value;
          }
        }
      }
      this.lastRefresh = Date.now();
    }
  }

  getCookieHeader(): string {
    return Object.entries(this.cookies)
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');
  }

  private isExpired(): boolean {
    return Date.now() - this.lastRefresh > this.ttlMs;
  }
}
