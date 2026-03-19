import { gotScraping } from 'got-scraping';
import { TIKTOK_BASE_URL, WEB_HEADERS } from '../config/constants.js';
import type { CookieStore, CookiePool, CookieSetEntry } from '../types/index.js';

class InMemoryCookieStore implements CookieStore {
  private pool: CookiePool | null = null;

  async load(): Promise<CookiePool | null> {
    return this.pool;
  }

  async save(pool: CookiePool): Promise<void> {
    this.pool = pool;
  }
}

export class CookieManager {
  private pool: CookiePool = [];
  private currentIndex: number = 0;
  private readonly poolSize: number;
  private readonly ttlMs: number;
  private readonly store: CookieStore;
  private initialized: boolean = false;

  constructor(options: { poolSize?: number; ttlMs?: number; store?: CookieStore } = {}) {
    this.poolSize = options.poolSize ?? 5;
    this.ttlMs = options.ttlMs ?? 30 * 60 * 1000;
    this.store = options.store ?? new InMemoryCookieStore();
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const saved = await this.store.load();
    if (saved && saved.length > 0) {
      this.pool = saved.filter((entry) => !this.isEntryExpired(entry));
    }

    const needed = this.poolSize - this.pool.length;
    if (needed > 0) {
      const fetches = Array.from({ length: needed }, () => this.fetchCookieSet());
      const results = await Promise.allSettled(fetches);

      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          this.pool.push(result.value);
        }
      }

      await this.store.save(this.pool);
    }

    this.initialized = true;
  }

  async getSessionCookies(): Promise<Record<string, string>> {
    await this.initialize();
    const entry = this.pool[0];
    if (!entry || this.isEntryExpired(entry)) {
      await this.refreshCookies();
    }
    return { ...(this.pool[0]?.cookies ?? {}) };
  }

  async refreshCookies(): Promise<void> {
    const newEntry = await this.fetchCookieSet();
    if (newEntry) {
      if (this.pool.length > 0) {
        this.pool[0] = newEntry;
      } else {
        this.pool.push(newEntry);
      }
      await this.store.save(this.pool);
    }
  }

  getNextCookieSet(): Record<string, string> {
    if (this.pool.length === 0) {
      return {};
    }
    const entry = this.pool[this.currentIndex % this.pool.length]!;
    entry.lastUsedAt = Date.now();
    this.currentIndex = (this.currentIndex + 1) % this.pool.length;
    return { ...entry.cookies };
  }

  getCookieHeader(): string {
    const cookies = this.getNextCookieSet();
    return Object.entries(cookies)
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');
  }

  async invalidateCookieSet(index: number): Promise<void> {
    if (index < 0 || index >= this.pool.length) return;

    this.pool.splice(index, 1);

    const replacement = await this.fetchCookieSet();
    if (replacement) {
      this.pool.push(replacement);
    }

    if (this.currentIndex >= this.pool.length) {
      this.currentIndex = 0;
    }

    await this.store.save(this.pool);
  }

  getCurrentIndex(): number {
    return this.currentIndex;
  }

  getPoolSize(): number {
    return this.pool.length;
  }

  private async fetchCookieSet(): Promise<CookieSetEntry | null> {
    try {
      const response = await gotScraping({
        url: TIKTOK_BASE_URL,
        headers: WEB_HEADERS,
        throwHttpErrors: false,
      });

      const setCookieHeaders = response.headers['set-cookie'];
      if (!setCookieHeaders) return null;

      const cookieArray = Array.isArray(setCookieHeaders)
        ? setCookieHeaders
        : [setCookieHeaders];

      const cookies: Record<string, string> = {};
      for (const cookie of cookieArray) {
        const [nameValue] = cookie.split(';');
        if (nameValue) {
          const eqIndex = nameValue.indexOf('=');
          if (eqIndex > 0) {
            const name = nameValue.slice(0, eqIndex).trim();
            const value = nameValue.slice(eqIndex + 1).trim();
            cookies[name] = value;
          }
        }
      }

      const now = Date.now();
      return { cookies, createdAt: now, lastUsedAt: now };
    } catch {
      return null;
    }
  }

  private isEntryExpired(entry: CookieSetEntry): boolean {
    return Date.now() - entry.createdAt > this.ttlMs;
  }
}
