import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CookieStore, CookiePool } from '../../../src/types/index.js';

// Mock got-scraping before importing CookieManager
vi.mock('got-scraping', () => ({
  gotScraping: vi.fn().mockResolvedValue({
    headers: {
      'set-cookie': [
        'msToken=mocktoken123; path=/; expires=Thu, 01 Jan 2099 00:00:00 GMT',
        'tt_webid=mockwebid456; path=/; expires=Thu, 01 Jan 2099 00:00:00 GMT',
      ],
    },
  }),
}));

import { CookieManager } from '../../../src/utils/cookie-manager.js';

function createMockStore(): CookieStore & { saved: CookiePool | null } {
  const store: CookieStore & { saved: CookiePool | null } = {
    saved: null,
    async load() {
      return this.saved;
    },
    async save(pool: CookiePool) {
      this.saved = pool;
    },
  };
  return store;
}

describe('CookieManager pool rotation', () => {
  let manager: CookieManager;

  beforeEach(async () => {
    manager = new CookieManager({ poolSize: 3 });
    await manager.initialize();
  });

  it('should initialize pool with requested size', () => {
    expect(manager.getPoolSize()).toBe(3);
  });

  it('should rotate cookies in round-robin order', () => {
    const first = manager.getNextCookieSet();
    const second = manager.getNextCookieSet();
    const third = manager.getNextCookieSet();
    const fourth = manager.getNextCookieSet();

    // After 3 sets, should wrap around
    expect(first).toEqual(fourth);
    expect(first.msToken).toBe('mocktoken123');
  });

  it('should invalidate and replace a cookie set', async () => {
    const sizeBefore = manager.getPoolSize();
    await manager.invalidateCookieSet(0);
    expect(manager.getPoolSize()).toBe(sizeBefore);
  });

  it('should handle invalidation of out-of-bounds index', async () => {
    const sizeBefore = manager.getPoolSize();
    await manager.invalidateCookieSet(999);
    expect(manager.getPoolSize()).toBe(sizeBefore);
  });
});

describe('CookieManager persistence', () => {
  it('should call store.save after initialization', async () => {
    const store = createMockStore();
    const manager = new CookieManager({ poolSize: 2, store });
    await manager.initialize();

    expect(store.saved).not.toBeNull();
    expect(store.saved!.length).toBe(2);
  });

  it('should restore from store.load on initialization', async () => {
    const store = createMockStore();

    // First run: populate store
    const manager1 = new CookieManager({ poolSize: 2, store });
    await manager1.initialize();

    // Second run: should load from store
    const manager2 = new CookieManager({ poolSize: 2, store });
    await manager2.initialize();

    expect(manager2.getPoolSize()).toBe(2);
  });

  it('should call store.save after invalidation', async () => {
    const store = createMockStore();
    const saveSpy = vi.spyOn(store, 'save');

    const manager = new CookieManager({ poolSize: 2, store });
    await manager.initialize();

    saveSpy.mockClear();
    await manager.invalidateCookieSet(0);

    expect(saveSpy).toHaveBeenCalled();
  });
});
