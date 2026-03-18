import { gotScraping } from 'got-scraping';
import { TIKTOK_BASE_URL, WEB_HEADERS, USER_AGENTS } from '../config/constants.js';
import {
  extractHydrationData,
  extractVideoFromHydration,
  extractProfileFromHydration,
  extractHashtagFromHydration,
} from '../extractors/hydration-extractor.js';
import { withRetry } from '../utils/retry-handler.js';
import { RateLimiter } from '../utils/rate-limiter.js';
import type { ClientConfig, RawVideoData, RawProfileData, RawHashtagData, RawSoundData } from '../types/index.js';

function randomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]!;
}

export class TikTokWebClient {
  private readonly proxyUrl?: string;
  private readonly rateLimiter: RateLimiter;
  private readonly maxRetries: number;

  constructor(config: ClientConfig = {}) {
    this.proxyUrl = config.proxyUrl;
    this.maxRetries = config.maxRetries ?? 3;
    this.rateLimiter = new RateLimiter();
  }

  async fetchProfile(username: string): Promise<RawProfileData> {
    const cleanUsername = username.startsWith('@') ? username.slice(1) : username;
    const url = `${TIKTOK_BASE_URL}/@${cleanUsername}`;
    const html = await this.fetchPage(url);
    const data = extractHydrationData(html);
    return extractProfileFromHydration(data);
  }

  async fetchVideo(videoUrl: string): Promise<RawVideoData> {
    const html = await this.fetchPage(videoUrl);
    const data = extractHydrationData(html);
    return extractVideoFromHydration(data);
  }

  async fetchHashtag(hashtag: string): Promise<RawHashtagData> {
    const cleanHashtag = hashtag.startsWith('#') ? hashtag.slice(1) : hashtag;
    const url = `${TIKTOK_BASE_URL}/tag/${cleanHashtag}`;
    const html = await this.fetchPage(url);
    const data = extractHydrationData(html);
    return extractHashtagFromHydration(data);
  }

  async fetchSound(musicUrl: string): Promise<RawSoundData> {
    const html = await this.fetchPage(musicUrl);
    const data = extractHydrationData(html);
    // Sound data uses a different path pattern
    const soundDetail = data['webapp.music-detail'] as Record<string, unknown> | undefined;
    if (!soundDetail) {
      // Fallback: try to find musicInfo in the scope
      for (const value of Object.values(data)) {
        if (value && typeof value === 'object' && 'musicInfo' in (value as Record<string, unknown>)) {
          return value as unknown as RawSoundData;
        }
      }
      throw new Error('Sound data not found in hydration data');
    }
    return soundDetail as unknown as RawSoundData;
  }

  private async fetchPage(url: string): Promise<string> {
    await this.rateLimiter.waitForSlot();

    return withRetry(
      async () => {
        const response = await gotScraping({
          url,
          headers: {
            ...WEB_HEADERS,
            'User-Agent': randomUserAgent(),
          },
          proxyUrl: this.proxyUrl,
          throwHttpErrors: true,
        });
        return response.body;
      },
      { maxRetries: this.maxRetries },
    );
  }
}
