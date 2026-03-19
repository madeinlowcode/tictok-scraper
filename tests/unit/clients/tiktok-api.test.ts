import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock got-scraping
vi.mock('got-scraping', () => ({
  gotScraping: vi.fn().mockResolvedValue({
    body: {
      itemList: [{ id: '123' }],
      hasMore: true,
      cursor: '100',
    },
    headers: {},
  }),
}));

// Mock cookie-manager
vi.mock('../../../src/utils/cookie-manager.js', () => ({
  CookieManager: vi.fn().mockImplementation(() => ({
    getNextCookieSet: vi.fn().mockReturnValue({ msToken: 'test-token', tt_webid: 'webid' }),
    getCurrentIndex: vi.fn().mockReturnValue(1),
    getPoolSize: vi.fn().mockReturnValue(3),
    invalidateCookieSet: vi.fn().mockResolvedValue(undefined),
    getSessionCookies: vi.fn().mockResolvedValue({ msToken: 'test-token' }),
    refreshCookies: vi.fn().mockResolvedValue(undefined),
  })),
}));

import { TikTokApiClient } from '../../../src/clients/tiktok-api.js';
import { gotScraping } from 'got-scraping';

describe('TikTokApiClient with signature integration', () => {
  let client: TikTokApiClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new TikTokApiClient();
  });

  it('should sign URLs when making profile video requests', async () => {
    const result = await client.getProfileVideos('secuid123');

    const calledUrl = (gotScraping as unknown as ReturnType<typeof vi.fn>).mock.calls[0]?.[0]?.url as string;
    expect(calledUrl).toContain('msToken=');
    expect(calledUrl).toContain('X-Bogus=');
  });

  it('should include requiresBrowserFallback in response', async () => {
    const result = await client.getProfileVideos('secuid123');
    expect(result).toHaveProperty('requiresBrowserFallback');
  });

  it('should use rotated cookies in request headers', async () => {
    await client.getProfileVideos('secuid123');

    const headers = (gotScraping as unknown as ReturnType<typeof vi.fn>).mock.calls[0]?.[0]?.headers;
    expect(headers?.Cookie).toContain('msToken=test-token');
  });

  it('should handle 403 response by setting fallback flag', async () => {
    const error = new Error('403') as Error & { statusCode: number };
    error.statusCode = 403;
    (gotScraping as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(error);

    const result = await client.getProfileVideos('secuid123');
    expect(result.requiresBrowserFallback).toBe(true);
  });

  it('should sign URLs for comment requests', async () => {
    (gotScraping as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      body: { comments: [], has_more: false, cursor: 0, total: 0 },
    });

    const result = await client.getComments('video123');
    const calledUrl = (gotScraping as unknown as ReturnType<typeof vi.fn>).mock.calls[0]?.[0]?.url as string;
    expect(calledUrl).toContain('X-Bogus=');
    expect(result).toHaveProperty('requiresBrowserFallback');
  });

  it('should sign URLs for search requests', async () => {
    (gotScraping as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      body: { data: [], has_more: false, cursor: '0' },
    });

    const result = await client.search('dance');
    const calledUrl = (gotScraping as unknown as ReturnType<typeof vi.fn>).mock.calls[0]?.[0]?.url as string;
    expect(calledUrl).toContain('X-Bogus=');
    expect(result).toHaveProperty('requiresBrowserFallback');
  });
});
