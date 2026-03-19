import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SignatureGenerator } from '../../../src/utils/signature-generator.js';
import type { CookieProvider } from '../../../src/types/index.js';

function createMockCookieProvider(cookies: Record<string, string> = {}): CookieProvider {
  return {
    getSessionCookies: vi.fn().mockResolvedValue(cookies),
    refreshCookies: vi.fn().mockResolvedValue(undefined),
  };
}

describe('SignatureGenerator.getMsToken', () => {
  it('should extract msToken from cookies', async () => {
    const provider = createMockCookieProvider({ msToken: 'abc123token' });
    const gen = new SignatureGenerator({ cookieProvider: provider });

    const token = await gen.getMsToken();
    expect(token).toBe('abc123token');
  });

  it('should return cached msToken on subsequent calls', async () => {
    const provider = createMockCookieProvider({ msToken: 'cached' });
    const gen = new SignatureGenerator({ cookieProvider: provider });

    await gen.getMsToken();
    await gen.getMsToken();

    expect(provider.getSessionCookies).toHaveBeenCalledTimes(1);
  });

  it('should refresh cookies when msToken is expired', async () => {
    const provider = createMockCookieProvider({ msToken: 'expired' });
    const gen = new SignatureGenerator({ cookieProvider: provider, msTokenTtlMs: 1 });

    await gen.getMsToken();
    await new Promise((r) => setTimeout(r, 5));
    await gen.getMsToken();

    expect(provider.getSessionCookies).toHaveBeenCalledTimes(2);
  });

  it('should trigger refresh when msToken is missing from cookies', async () => {
    const provider = createMockCookieProvider({});
    (provider.getSessionCookies as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ msToken: 'after-refresh' });

    const gen = new SignatureGenerator({ cookieProvider: provider });
    const token = await gen.getMsToken();

    expect(provider.refreshCookies).toHaveBeenCalled();
    expect(token).toBe('after-refresh');
  });

  it('should return null when msToken is not available even after refresh', async () => {
    const provider = createMockCookieProvider({});
    const gen = new SignatureGenerator({ cookieProvider: provider });

    const token = await gen.getMsToken();
    expect(token).toBeNull();
  });
});

describe('SignatureGenerator.generateXBogus', () => {
  let gen: SignatureGenerator;

  beforeEach(() => {
    gen = new SignatureGenerator({ cookieProvider: createMockCookieProvider() });
  });

  it('should generate X-Bogus for a valid URL', () => {
    const result = gen.generateXBogus('https://www.tiktok.com/api/post/item_list/?aid=1988&count=30');
    expect(result).toBeTruthy();
    expect(result).toMatch(/^DFSzswVo/);
  });

  it('should return null for invalid URL', () => {
    const result = gen.generateXBogus('not-a-url');
    expect(result).toBeNull();
  });
});

describe('SignatureGenerator.signUrl', () => {
  it('should sign URL with both msToken and X-Bogus', async () => {
    const provider = createMockCookieProvider({ msToken: 'token123' });
    const gen = new SignatureGenerator({ cookieProvider: provider });

    const result = await gen.signUrl('https://www.tiktok.com/api/post/item_list/', {
      aid: '1988',
      count: '30',
    });

    expect(result.signedUrl).toContain('msToken=token123');
    expect(result.signedUrl).toContain('X-Bogus=');
    expect(result.requiresBrowserFallback).toBe(false);
  });

  it('should set requiresBrowserFallback when X-Bogus fails', async () => {
    const provider = createMockCookieProvider({ msToken: 'token123' });
    const gen = new SignatureGenerator({ cookieProvider: provider });

    // Mock generateXBogus to return null
    vi.spyOn(gen, 'generateXBogus').mockReturnValue(null);

    const result = await gen.signUrl('https://www.tiktok.com/api/post/item_list/', {
      aid: '1988',
    });

    expect(result.requiresBrowserFallback).toBe(true);
    expect(result.signedUrl).toContain('msToken=token123');
  });

  it('should proceed without msToken when not available', async () => {
    const provider = createMockCookieProvider({});
    const gen = new SignatureGenerator({ cookieProvider: provider });

    const result = await gen.signUrl('https://www.tiktok.com/api/post/item_list/', {
      aid: '1988',
    });

    expect(result.signedUrl).not.toContain('msToken');
    expect(result.requiresBrowserFallback).toBe(false);
  });
});
