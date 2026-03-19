import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { TokenStore } from '../../../src/types/index.js';

// Mock got-scraping
vi.mock('got-scraping', () => ({
  gotScraping: vi.fn().mockResolvedValue({
    body: '<html><script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application/json">{"__DEFAULT_SCOPE__":{"webapp.user-detail":{"userInfo":{"user":{"id":"1","secUid":"sec","uniqueId":"test","nickname":"Test","signature":"bio","verified":false,"privateAccount":false,"avatarLarger":"","region":"BR"},"stats":{"followerCount":0,"followingCount":0,"heartCount":0,"videoCount":0}}}}}</script></html>',
    headers: {},
  }),
}));

// Mock cookie-manager for API client
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

import { gotScraping } from 'got-scraping';
import { TikTokWebClient } from '../../../src/clients/tiktok-web.js';
import { TikTokApiClient } from '../../../src/clients/tiktok-api.js';

function createValidTokenStore(): TokenStore {
  return {
    ttWebId: 'webid123',
    msToken: 'mstoken456',
    ttChainToken: 'chain789',
    ttwid: 'tw000',
    cookies: { tt_webid: 'webid123', msToken: 'mstoken456' },
    extractedAt: Date.now(),
  };
}

function createStaleTokenStore(): TokenStore {
  return {
    msToken: 'stale-token',
    cookies: { msToken: 'stale-token' },
    extractedAt: Date.now() - 31 * 60 * 1000, // 31 minutes ago
  };
}

describe('TikTokWebClient token injection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (gotScraping as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      body: '<html><script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application/json">{"__DEFAULT_SCOPE__":{"webapp.user-detail":{"userInfo":{"user":{"id":"1","secUid":"sec","uniqueId":"test","nickname":"Test","signature":"bio","verified":false,"privateAccount":false,"avatarLarger":"","region":"BR"},"stats":{"followerCount":0,"followingCount":0,"heartCount":0,"videoCount":0}}}}}</script></html>',
      headers: {},
    });
  });

  it('should include tokens in headers when TokenStore is valid', async () => {
    const client = new TikTokWebClient();
    client.setTokenStore(createValidTokenStore());

    await client.fetchProfile('testuser');

    const headers = (gotScraping as unknown as ReturnType<typeof vi.fn>).mock.calls[0]?.[0]?.headers;
    expect(headers.Cookie).toContain('msToken=mstoken456');
    expect(headers.Cookie).toContain('tt_webid=webid123');
  });

  it('should not include tokens when TokenStore is stale', async () => {
    const client = new TikTokWebClient();
    client.setTokenStore(createStaleTokenStore());

    await client.fetchProfile('testuser');

    const headers = (gotScraping as unknown as ReturnType<typeof vi.fn>).mock.calls[0]?.[0]?.headers;
    expect(headers.Cookie).toBeUndefined();
  });
});

describe('TikTokApiClient token injection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (gotScraping as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      body: { itemList: [], hasMore: false, cursor: '0' },
    });
  });

  it('should include msToken in params when TokenStore is valid', async () => {
    const client = new TikTokApiClient();
    client.setTokenStore(createValidTokenStore());

    await client.getProfileVideos('secuid123');

    const calledUrl = (gotScraping as unknown as ReturnType<typeof vi.fn>).mock.calls[0]?.[0]?.url as string;
    expect(calledUrl).toContain('msToken=mstoken456');
  });

  it('should not inject tokens when TokenStore is stale', async () => {
    const client = new TikTokApiClient();
    client.setTokenStore(createStaleTokenStore());

    await client.getProfileVideos('secuid123');

    const calledUrl = (gotScraping as unknown as ReturnType<typeof vi.fn>).mock.calls[0]?.[0]?.url as string;
    // stale msToken should NOT be directly injected as params
    expect(calledUrl).not.toContain('msToken=stale-token');
  });
});
