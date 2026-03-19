import { TIKTOK_BASE_URL } from '../config/constants.js';
import {
  extractHydrationData,
  extractVideoFromHydration,
  extractProfileFromHydration,
  extractHashtagFromHydration,
} from '../extractors/hydration-extractor.js';
import { createTokenStore } from '../utils/token-store.js';
import type {
  BrowserClientOptions,
  TokenStore,
  RawVideoData,
  RawProfileData,
  RawHashtagData,
  RawSoundData,
} from '../types/index.js';

// Minimal Playwright-compatible interfaces to avoid hard dependency
interface BrowserResponse {
  url(): string;
  headers(): Record<string, string>;
  json(): Promise<unknown>;
}

interface BrowserPage {
  on(event: 'response', handler: (response: BrowserResponse) => void): void;
  goto(url: string, options?: Record<string, unknown>): Promise<unknown>;
  waitForSelector(selector: string, options?: Record<string, unknown>): Promise<unknown>;
  evaluate(fn: () => unknown): Promise<unknown>;
  close(): Promise<void>;
  context(): BrowserContext;
}

interface BrowserCookie {
  name: string;
  value: string;
}

interface BrowserContext {
  newPage(): Promise<BrowserPage>;
  cookies(url?: string): Promise<BrowserCookie[]>;
  close(): Promise<void>;
}

interface Browser {
  newContext(options?: Record<string, unknown>): Promise<BrowserContext>;
  close(): Promise<void>;
}

interface Chromium {
  launch(options?: Record<string, unknown>): Promise<Browser>;
}

export async function loadChromium(): Promise<Chromium> {
  try {
    const moduleName = 'playwright';
    const pw = await import(/* webpackIgnore: true */ moduleName) as { chromium: Chromium };
    return pw.chromium;
  } catch {
    const moduleName = 'playwright-core';
    const pw = await import(/* webpackIgnore: true */ moduleName) as { chromium: Chromium };
    return pw.chromium;
  }
}

const API_URL_PATTERNS = [
  '/api/post/item_list/',
  '/api/comment/list/',
  '/api/search/',
  '/api/',
];

const IGNORED_EXTENSIONS = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2', '.ico'];

function isApiResponse(url: string): boolean {
  return API_URL_PATTERNS.some((pattern) => url.includes(pattern));
}

function shouldIgnore(url: string, contentType?: string): boolean {
  if (IGNORED_EXTENSIONS.some((ext) => url.includes(ext))) return true;
  if (contentType && !contentType.includes('json') && !contentType.includes('html')) return true;
  return false;
}

export class TikTokBrowserClient {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private readonly proxyUrl?: string;

  constructor(options: BrowserClientOptions = {}) {
    this.proxyUrl = options.proxyUrl;
  }

  private async ensureBrowser(): Promise<BrowserContext> {
    if (this.context) return this.context;

    // Dynamic import to avoid compile-time dependency on playwright
    const chromium = await loadChromium();

    const launchOptions: Record<string, unknown> = {
      headless: true,
    };

    if (this.proxyUrl) {
      launchOptions.proxy = { server: this.proxyUrl };
    }

    this.browser = await chromium.launch(launchOptions);
    this.context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      locale: 'pt-BR',
    });

    return this.context;
  }

  private async navigateAndIntercept(
    url: string,
  ): Promise<{ page: BrowserPage; intercepted: Record<string, unknown>[] }> {
    const ctx = await this.ensureBrowser();
    const page = await ctx.newPage();
    const intercepted: Record<string, unknown>[] = [];

    page.on('response', async (response: BrowserResponse) => {
      const respUrl = response.url();
      const contentType = response.headers()['content-type'] ?? '';

      if (shouldIgnore(respUrl, contentType)) return;
      if (!isApiResponse(respUrl)) return;

      try {
        const body = await response.json();
        if (body && typeof body === 'object') {
          intercepted.push(body as Record<string, unknown>);
        }
      } catch {
        // Not JSON, ignore
      }
    });

    await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });

    return { page, intercepted };
  }

  private async extractHydrationFromPage(page: BrowserPage): Promise<Record<string, unknown> | null> {
    try {
      const scriptContent = await page.evaluate(() => {
        const el = document.getElementById('__UNIVERSAL_DATA_FOR_REHYDRATION__');
        return el?.textContent ?? null;
      }) as string | null;

      if (scriptContent) {
        const json = JSON.parse(scriptContent);
        return json['__DEFAULT_SCOPE__'] ?? null;
      }
    } catch {
      // Hydration extraction failed
    }
    return null;
  }

  async fetchVideo(videoUrl: string): Promise<RawVideoData> {
    const { page, intercepted } = await this.navigateAndIntercept(videoUrl);

    try {
      const hydration = await this.extractHydrationFromPage(page);
      if (hydration) {
        try {
          return extractVideoFromHydration(hydration);
        } catch {
          // Fall through to intercepted data
        }
      }

      for (const data of intercepted) {
        if (data.itemInfo || data.itemList) {
          const itemInfo = data.itemInfo as Record<string, unknown> | undefined;
          if (itemInfo?.itemStruct) {
            return itemInfo.itemStruct as unknown as RawVideoData;
          }
        }
      }

      throw new Error('No video data found in browser response');
    } finally {
      await page.close();
    }
  }

  async fetchProfile(username: string): Promise<RawProfileData> {
    const cleanUsername = username.startsWith('@') ? username.slice(1) : username;
    const url = `${TIKTOK_BASE_URL}/@${cleanUsername}`;
    const { page, intercepted } = await this.navigateAndIntercept(url);

    try {
      const hydration = await this.extractHydrationFromPage(page);
      if (hydration) {
        try {
          return extractProfileFromHydration(hydration);
        } catch {
          // Fall through
        }
      }

      for (const data of intercepted) {
        if (data.userInfo) {
          return data.userInfo as unknown as RawProfileData;
        }
      }

      throw new Error('No profile data found in browser response');
    } finally {
      await page.close();
    }
  }

  async fetchHashtag(hashtag: string): Promise<RawHashtagData> {
    const cleanHashtag = hashtag.startsWith('#') ? hashtag.slice(1) : hashtag;
    const url = `${TIKTOK_BASE_URL}/tag/${cleanHashtag}`;
    const { page, intercepted } = await this.navigateAndIntercept(url);

    try {
      const hydration = await this.extractHydrationFromPage(page);
      if (hydration) {
        try {
          return extractHashtagFromHydration(hydration);
        } catch {
          // Fall through
        }
      }

      for (const data of intercepted) {
        if (data.challengeInfo) {
          return data as unknown as RawHashtagData;
        }
      }

      throw new Error('No hashtag data found in browser response');
    } finally {
      await page.close();
    }
  }

  async fetchSound(musicUrl: string): Promise<RawSoundData> {
    const { page, intercepted } = await this.navigateAndIntercept(musicUrl);

    try {
      const hydration = await this.extractHydrationFromPage(page);
      if (hydration) {
        const soundDetail = hydration['webapp.music-detail'] as Record<string, unknown> | undefined;
        if (soundDetail) {
          return soundDetail as unknown as RawSoundData;
        }
        for (const value of Object.values(hydration)) {
          if (value && typeof value === 'object' && 'musicInfo' in (value as Record<string, unknown>)) {
            return value as unknown as RawSoundData;
          }
        }
      }

      for (const data of intercepted) {
        if (data.musicInfo) {
          return data as unknown as RawSoundData;
        }
      }

      throw new Error('No sound data found in browser response');
    } finally {
      await page.close();
    }
  }

  async getTokenStore(): Promise<TokenStore> {
    const ctx = await this.ensureBrowser();
    const browserCookies = await ctx.cookies(TIKTOK_BASE_URL);

    const cookieMap: Record<string, string> = {};
    for (const cookie of browserCookies) {
      cookieMap[cookie.name] = cookie.value;
    }

    return createTokenStore(cookieMap);
  }

  async dispose(): Promise<void> {
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
