import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock got-scraping
vi.mock('got-scraping', () => ({
  gotScraping: vi.fn().mockResolvedValue({
    body: '<html><script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application/json">{"__DEFAULT_SCOPE__":{"webapp.video-detail":{"itemInfo":{"itemStruct":{"id":"v1","desc":"test","createTime":1700000000,"video":{"duration":15,"cover":"https://cover.jpg","playAddr":"https://play.mp4"},"stats":{"diggCount":100,"shareCount":10,"commentCount":5,"playCount":1000,"collectCount":50},"author":{"uniqueId":"user1","nickname":"User 1","id":"u1","avatarLarger":"https://avatar.jpg","verified":false},"music":{"id":"m1","title":"Song","authorName":"Artist","album":"Album","original":true,"duration":15,"coverLarge":"https://music.jpg","playUrl":"https://music.mp3"},"challenges":[],"isAd":false}}}}}</script></html>',
    headers: {},
  }),
}));

// Mock cookie-manager
vi.mock('../../../src/utils/cookie-manager.js', () => ({
  CookieManager: vi.fn().mockImplementation(() => ({
    getNextCookieSet: vi.fn().mockReturnValue({}),
    getCurrentIndex: vi.fn().mockReturnValue(0),
    getPoolSize: vi.fn().mockReturnValue(1),
    invalidateCookieSet: vi.fn().mockResolvedValue(undefined),
    getSessionCookies: vi.fn().mockResolvedValue({}),
    refreshCookies: vi.fn().mockResolvedValue(undefined),
  })),
}));

// Mock retry handler to not retry (avoids timeouts in tests)
vi.mock('../../../src/utils/retry-handler.js', () => ({
  withRetry: vi.fn((fn: () => Promise<unknown>) => fn()),
}));

import { scrapeVideo } from '../../../src/scrapers/video-scraper.js';
import { scrapeComments } from '../../../src/scrapers/comment-scraper.js';
import { scrapeSearch } from '../../../src/scrapers/search-scraper.js';
import { TikTokWebClient } from '../../../src/clients/tiktok-web.js';
import { TikTokApiClient } from '../../../src/clients/tiktok-api.js';
import { gotScraping } from 'got-scraping';
import type { TikTokBrowserClient } from '../../../src/clients/tiktok-browser.js';
import type { RawVideoData } from '../../../src/types/index.js';

const mockRawVideo: RawVideoData = {
  id: 'v1', desc: 'test', createTime: 1700000000,
  video: { duration: 15, cover: 'https://cover.jpg', playAddr: 'https://play.mp4' },
  stats: { diggCount: 100, shareCount: 10, commentCount: 5, playCount: 1000, collectCount: 50 },
  author: { uniqueId: 'user1', nickname: 'User 1', id: 'u1', avatarLarger: 'https://avatar.jpg', verified: false },
  music: { id: 'm1', title: 'Song', authorName: 'Artist', album: 'Album', original: true, duration: 15, coverLarge: 'https://music.jpg', playUrl: 'https://music.mp3' },
  challenges: [], isAd: false,
};

function createMockBrowserClient(): TikTokBrowserClient {
  return {
    fetchVideo: vi.fn().mockResolvedValue(mockRawVideo),
    fetchProfile: vi.fn().mockResolvedValue({
      user: { id: '1', secUid: 'sec', uniqueId: 'user', nickname: 'User', signature: '', verified: false, privateAccount: false, avatarLarger: '', region: 'BR' },
      stats: { followerCount: 0, followingCount: 0, heartCount: 0, videoCount: 0 },
    }),
    fetchHashtag: vi.fn(),
    fetchSound: vi.fn(),
    getTokenStore: vi.fn().mockResolvedValue({ cookies: {}, extractedAt: Date.now() }),
    dispose: vi.fn(),
  } as unknown as TikTokBrowserClient;
}

describe('Video scraper fallback', () => {
  let webClient: TikTokWebClient;

  beforeEach(() => {
    vi.clearAllMocks();
    webClient = new TikTokWebClient();
  });

  it('should use Layer 1 when it succeeds without invoking browser client', async () => {
    const browserClient = createMockBrowserClient();
    const result = await scrapeVideo(webClient, 'https://www.tiktok.com/@user/video/123', { browserClient });

    expect(result.videoId).toBe('v1');
    expect(browserClient.fetchVideo).not.toHaveBeenCalled();
  });

  it('should fall back to browser client when Layer 1 fails', async () => {
    // Must reject all retries (default 3 retries + 1 initial = 4 calls)
    const mockGot = gotScraping as unknown as ReturnType<typeof vi.fn>;
    mockGot.mockRejectedValue(new Error('Layer 1 failed'));

    const browserClient = createMockBrowserClient();
    const result = await scrapeVideo(webClient, 'https://www.tiktok.com/@user/video/123', { browserClient });

    expect(result.videoId).toBe('v1');
    expect(browserClient.fetchVideo).toHaveBeenCalled();

    // Restore default mock
    mockGot.mockResolvedValue({
      body: '<html><script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application/json">{"__DEFAULT_SCOPE__":{"webapp.video-detail":{"itemInfo":{"itemStruct":{"id":"v1","desc":"test","createTime":1700000000,"video":{"duration":15,"cover":"https://cover.jpg","playAddr":"https://play.mp4"},"stats":{"diggCount":100,"shareCount":10,"commentCount":5,"playCount":1000,"collectCount":50},"author":{"uniqueId":"user1","nickname":"User 1","id":"u1","avatarLarger":"https://avatar.jpg","verified":false},"music":{"id":"m1","title":"Song","authorName":"Artist","album":"Album","original":true,"duration":15,"coverLarge":"https://music.jpg","playUrl":"https://music.mp3"},"challenges":[],"isAd":false}}}}}</script></html>',
      headers: {},
    });
  });

  it('should work without browser client (no fallback attempted)', async () => {
    const result = await scrapeVideo(webClient, 'https://www.tiktok.com/@user/video/123');
    expect(result.videoId).toBe('v1');
  });
});

describe('Comment scraper fallback', () => {
  let apiClient: TikTokApiClient;

  beforeEach(() => {
    vi.clearAllMocks();
    (gotScraping as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      body: {
        comments: [{ cid: 'c1', text: 'hello', create_time: 1700000000, digg_count: 5, reply_comment_total: 0, is_author_digged: false, user: { uid: 'u1', unique_id: 'user', nickname: 'User', avatar_larger: '' } }],
        has_more: false, cursor: 0, total: 1,
      },
    });
    apiClient = new TikTokApiClient();
  });

  it('should fall back to browser client when Layer 2 fails', async () => {
    const mockGot = gotScraping as unknown as ReturnType<typeof vi.fn>;
    mockGot.mockRejectedValue(new Error('API failed'));

    const browserClient = createMockBrowserClient();
    const result = await scrapeComments(apiClient, 'video123', { browserClient });

    // Browser fallback returns empty for comments (intercepted)
    expect(result).toEqual([]);
    expect(browserClient.fetchVideo).toHaveBeenCalled();
  });
});

describe('Search scraper fallback', () => {
  let apiClient: TikTokApiClient;

  beforeEach(() => {
    vi.clearAllMocks();
    (gotScraping as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      body: { data: [], has_more: false, cursor: '0' },
    });
    apiClient = new TikTokApiClient();
  });

  it('should fall back to browser client when Layer 2 fails', async () => {
    const mockGot = gotScraping as unknown as ReturnType<typeof vi.fn>;
    mockGot.mockRejectedValue(new Error('Search API failed'));

    const browserClient = createMockBrowserClient();
    const result = await scrapeSearch(apiClient, 'dance', { browserClient });

    expect(result).toEqual([]);
    expect(browserClient.fetchVideo).toHaveBeenCalled();
  });
});

describe('Scraper modules without browser client', () => {
  it('should work without browser client for video', async () => {
    vi.clearAllMocks();
    (gotScraping as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      body: '<html><script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application/json">{"__DEFAULT_SCOPE__":{"webapp.video-detail":{"itemInfo":{"itemStruct":{"id":"v1","desc":"test","createTime":1700000000,"video":{"duration":15,"cover":"https://cover.jpg","playAddr":"https://play.mp4"},"stats":{"diggCount":100,"shareCount":10,"commentCount":5,"playCount":1000,"collectCount":50},"author":{"uniqueId":"user1","nickname":"User 1","id":"u1","avatarLarger":"https://avatar.jpg","verified":false},"music":{"id":"m1","title":"Song","authorName":"Artist","album":"Album","original":true,"duration":15,"coverLarge":"https://music.jpg","playUrl":"https://music.mp3"},"challenges":[],"isAd":false}}}}}</script></html>',
      headers: {},
    });

    const webClient = new TikTokWebClient();
    const result = await scrapeVideo(webClient, 'https://www.tiktok.com/@user/video/123');
    expect(result.videoId).toBe('v1');
  });
});
