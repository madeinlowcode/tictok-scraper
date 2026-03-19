import { describe, it, expect, vi, afterEach } from 'vitest';
import { createTokenStore, isTokenStoreValid, tokensToCookieHeader } from '../../../src/utils/token-store.js';

describe('createTokenStore', () => {
  it('should set extractedAt to current timestamp', () => {
    const before = Date.now();
    const store = createTokenStore({ msToken: 'abc' });
    const after = Date.now();

    expect(store.extractedAt).toBeGreaterThanOrEqual(before);
    expect(store.extractedAt).toBeLessThanOrEqual(after);
  });

  it('should extract known token fields from cookies', () => {
    const store = createTokenStore({
      tt_webid: 'webid123',
      msToken: 'ms123',
      tt_chain_token: 'chain123',
      ttwid: 'tw123',
      other: 'value',
    });

    expect(store.ttWebId).toBe('webid123');
    expect(store.msToken).toBe('ms123');
    expect(store.ttChainToken).toBe('chain123');
    expect(store.ttwid).toBe('tw123');
  });

  it('should handle missing optional tokens as undefined', () => {
    const store = createTokenStore({ other: 'value' });

    expect(store.ttWebId).toBeUndefined();
    expect(store.msToken).toBeUndefined();
    expect(store.ttChainToken).toBeUndefined();
    expect(store.ttwid).toBeUndefined();
  });
});

describe('isTokenStoreValid', () => {
  it('should return true when within default window', () => {
    const store = createTokenStore({});
    expect(isTokenStoreValid(store)).toBe(true);
  });

  it('should return false when expired', () => {
    const store = createTokenStore({});
    store.extractedAt = Date.now() - 31 * 60 * 1000; // 31 minutes ago
    expect(isTokenStoreValid(store)).toBe(false);
  });

  it('should respect custom maxAgeMs', () => {
    const store = createTokenStore({});
    store.extractedAt = Date.now() - 5000; // 5 seconds ago
    expect(isTokenStoreValid(store, 3000)).toBe(false);
    expect(isTokenStoreValid(store, 10000)).toBe(true);
  });
});

describe('tokensToCookieHeader', () => {
  it('should format cookies as header string', () => {
    const store = createTokenStore({
      msToken: 'abc',
      tt_webid: '123',
    });

    const header = tokensToCookieHeader(store);
    expect(header).toContain('msToken=abc');
    expect(header).toContain('tt_webid=123');
  });

  it('should handle empty cookies', () => {
    const store = createTokenStore({});
    expect(tokensToCookieHeader(store)).toBe('');
  });
});
