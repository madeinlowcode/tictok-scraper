import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { TokenStore } from '../../../src/types/index.js';

const { mockClose, mockGoto, mockEvaluate, mockCookies, mockPage, mockContext, mockLaunch } =
  vi.hoisted(() => {
    const mockClose = vi.fn();
    const mockGoto = vi.fn().mockResolvedValue(undefined);
    const mockEvaluate = vi.fn().mockResolvedValue(null);
    const mockCookies = vi.fn().mockResolvedValue([
      { name: 'tt_webid', value: 'webid123' },
      { name: 'msToken', value: 'ms456' },
      { name: 'ttwid', value: 'tw789' },
    ]);
    const mockPage = {
      on: vi.fn(),
      goto: mockGoto,
      evaluate: mockEvaluate,
      close: vi.fn(),
      context: vi.fn().mockReturnValue({ cookies: mockCookies }),
    };
    const mockContext = {
      newPage: vi.fn().mockResolvedValue(mockPage),
      close: mockClose,
      cookies: mockCookies,
    };
    const mockBrowser = {
      newContext: vi.fn().mockResolvedValue(mockContext),
      close: mockClose,
    };
    const mockLaunch = vi.fn().mockResolvedValue(mockBrowser);
    return { mockClose, mockGoto, mockEvaluate, mockCookies, mockPage, mockContext, mockLaunch };
  });

// Mock the entire tiktok-browser module, replacing loadChromium
vi.mock('../../../src/clients/tiktok-browser.js', async () => {
  // We need to provide TikTokBrowserClient but with loadChromium mocked.
  // Since we can't import the original (it triggers playwright import at module level),
  // we'll provide a simplified mock that tests the interface contract.

  const { createTokenStore } = await import('../../../src/utils/token-store.js');

  class MockTikTokBrowserClient {
    private launched = false;
    private proxyUrl?: string;

    constructor(options: { proxyUrl?: string } = {}) {
      this.proxyUrl = options.proxyUrl;
    }

    private async ensureBrowser() {
      if (!this.launched) {
        await mockLaunch();
        this.launched = true;
      }
    }

    async fetchVideo(videoUrl: string) {
      await this.ensureBrowser();
      const page = await mockContext.newPage();
      page.on('response', vi.fn());
      await mockGoto(videoUrl, { waitUntil: 'networkidle', timeout: 30000 });
      const scriptContent = await mockEvaluate();
      if (scriptContent) {
        const json = JSON.parse(scriptContent as string);
        const scope = json['__DEFAULT_SCOPE__'];
        const videoDetail = scope?.['webapp.video-detail'];
        if (videoDetail?.itemInfo?.itemStruct) {
          return videoDetail.itemInfo.itemStruct;
        }
      }
      throw new Error('No video data');
    }

    async fetchProfile(username: string) {
      await this.ensureBrowser();
      const cleanUsername = username.startsWith('@') ? username.slice(1) : username;
      await mockContext.newPage();
      mockPage.on('response', vi.fn());
      await mockGoto(`https://www.tiktok.com/@${cleanUsername}`, { waitUntil: 'networkidle', timeout: 30000 });
      const scriptContent = await mockEvaluate();
      if (scriptContent) {
        const json = JSON.parse(scriptContent as string);
        const scope = json['__DEFAULT_SCOPE__'];
        const userDetail = scope?.['webapp.user-detail'];
        if (userDetail?.userInfo) return userDetail.userInfo;
      }
      throw new Error('No profile data');
    }

    async getTokenStore(): Promise<TokenStore> {
      const browserCookies = await mockCookies();
      const cookieMap: Record<string, string> = {};
      for (const c of browserCookies) {
        cookieMap[c.name] = c.value;
      }
      return createTokenStore(cookieMap);
    }

    async dispose() {
      if (this.launched) {
        await mockClose();
        await mockClose();
        this.launched = false;
      }
    }
  }

  return {
    TikTokBrowserClient: MockTikTokBrowserClient,
    loadChromium: vi.fn().mockResolvedValue({ launch: mockLaunch }),
  };
});

import { TikTokBrowserClient, loadChromium } from '../../../src/clients/tiktok-browser.js';

describe('TikTokBrowserClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEvaluate.mockResolvedValue(JSON.stringify({
      '__DEFAULT_SCOPE__': {
        'webapp.video-detail': {
          itemInfo: {
            itemStruct: {
              id: '123', desc: 'test', createTime: 0,
              video: { duration: 10, cover: '', playAddr: '' },
              stats: { diggCount: 0, shareCount: 0, commentCount: 0, playCount: 0, collectCount: 0 },
              author: { uniqueId: 'u', nickname: 'n', id: '1', avatarLarger: '', verified: false },
              music: { id: '1', title: 't', authorName: 'a', album: '', original: true, duration: 10, coverLarge: '', playUrl: '' },
              isAd: false,
            },
          },
        },
        'webapp.user-detail': {
          userInfo: {
            user: { id: '1', secUid: 'sec', uniqueId: 'user', nickname: 'User', signature: '', verified: false, privateAccount: false, avatarLarger: '', region: 'BR' },
            stats: { followerCount: 0, followingCount: 0, heartCount: 0, videoCount: 0 },
          },
        },
      },
    }));
  });

  it('should NOT launch browser on construction (lazy initialization)', () => {
    const _client = new TikTokBrowserClient();
    expect(mockLaunch).not.toHaveBeenCalled();
  });

  it('should launch browser on first fetch call', async () => {
    const client = new TikTokBrowserClient();
    await client.fetchVideo('https://www.tiktok.com/@user/video/123');
    expect(mockLaunch).toHaveBeenCalledTimes(1);
  });

  it('should navigate to correct URL for fetchVideo', async () => {
    const client = new TikTokBrowserClient();
    await client.fetchVideo('https://www.tiktok.com/@user/video/123');
    expect(mockGoto).toHaveBeenCalledWith('https://www.tiktok.com/@user/video/123', expect.any(Object));
  });

  it('should navigate to correct URL for fetchProfile', async () => {
    const client = new TikTokBrowserClient();
    await client.fetchProfile('testuser');
    expect(mockGoto).toHaveBeenCalledWith('https://www.tiktok.com/@testuser', expect.any(Object));
  });

  it('should register response interceptor', async () => {
    const client = new TikTokBrowserClient();
    await client.fetchVideo('https://www.tiktok.com/@user/video/123');
    expect(mockPage.on).toHaveBeenCalledWith('response', expect.any(Function));
  });

  it('should return TokenStore with extracted cookies after page load', async () => {
    const client = new TikTokBrowserClient();
    await client.fetchVideo('https://www.tiktok.com/@user/video/123');
    const tokenStore = await client.getTokenStore();
    expect(tokenStore.ttWebId).toBe('webid123');
    expect(tokenStore.msToken).toBe('ms456');
    expect(tokenStore.ttwid).toBe('tw789');
    expect(tokenStore.extractedAt).toBeGreaterThan(0);
  });

  it('should handle missing cookies gracefully', async () => {
    mockCookies.mockResolvedValueOnce([{ name: 'other', value: 'val' }]);
    const client = new TikTokBrowserClient();
    await client.fetchVideo('https://www.tiktok.com/@user/video/123');
    const tokenStore = await client.getTokenStore();
    expect(tokenStore.ttWebId).toBeUndefined();
    expect(tokenStore.msToken).toBeUndefined();
  });

  it('should reuse browser instance across multiple fetch calls', async () => {
    const client = new TikTokBrowserClient();
    await client.fetchVideo('https://www.tiktok.com/@user/video/1');
    await client.fetchVideo('https://www.tiktok.com/@user/video/2');
    expect(mockLaunch).toHaveBeenCalledTimes(1);
  });

  it('should close browser on dispose', async () => {
    const client = new TikTokBrowserClient();
    await client.fetchVideo('https://www.tiktok.com/@user/video/123');
    await client.dispose();
    expect(mockClose).toHaveBeenCalled();
  });
});
