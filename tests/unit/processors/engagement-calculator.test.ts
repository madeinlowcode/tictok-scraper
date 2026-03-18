import { describe, it, expect } from 'vitest';
import { calculateEngagement } from '../../../src/processors/engagement-calculator.js';
import type { ProfileOutput, VideoOutput } from '../../../src/types/index.js';

function makeProfile(overrides: Partial<ProfileOutput> = {}): ProfileOutput {
  return {
    userId: '1',
    secUid: 'sec1',
    username: 'testuser',
    nickname: 'Test',
    bio: '',
    avatarUrl: '',
    isVerified: false,
    isPrivate: false,
    followerCount: 100000,
    followingCount: 500,
    heartCount: 3000000,
    videoCount: 100,
    region: 'BR',
    scrapedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeVideo(stats: { playCount: number; likeCount: number; commentCount: number; shareCount: number }): VideoOutput {
  return {
    videoId: '1',
    url: '',
    description: '',
    createTime: 0,
    createTimeISO: '',
    duration: 0,
    coverUrl: '',
    stats: { ...stats, collectCount: 0 },
    hashtags: [],
    author: { userId: '', username: '', nickname: '', avatarUrl: '', isVerified: false },
    music: { musicId: '', title: '', authorName: '', albumName: '', isOriginal: false, duration: 0, coverUrl: '' },
    isAd: false,
    scrapedAt: '',
  };
}

describe('calculateEngagement', () => {
  it('should calculate metrics correctly for normal case', () => {
    const profile = makeProfile();
    const videos = [
      makeVideo({ playCount: 100000, likeCount: 5000, commentCount: 200, shareCount: 100 }),
      makeVideo({ playCount: 200000, likeCount: 10000, commentCount: 400, shareCount: 200 }),
    ];

    const result = calculateEngagement(profile, videos);

    expect(result.avgViews).toBe(150000);
    expect(result.avgLikes).toBe(7500);
    expect(result.avgComments).toBe(300);
    expect(result.avgShares).toBe(150);
    expect(result.engagementRate).toBeGreaterThan(0);
    expect(result.likeToViewRatio).toBeGreaterThan(0);
    expect(result.commentToViewRatio).toBeGreaterThan(0);
    expect(result.shareToViewRatio).toBeGreaterThan(0);
  });

  it('should return zeros for empty video list', () => {
    const profile = makeProfile();
    const result = calculateEngagement(profile, []);

    expect(result.avgViews).toBe(0);
    expect(result.avgLikes).toBe(0);
    expect(result.engagementRate).toBe(0);
    expect(result.likeToViewRatio).toBe(0);
    expect(result.estimatedReach).toBe(0);
  });

  it('should handle zero views without NaN', () => {
    const profile = makeProfile();
    const videos = [
      makeVideo({ playCount: 0, likeCount: 0, commentCount: 0, shareCount: 0 }),
    ];

    const result = calculateEngagement(profile, videos);

    expect(result.engagementRate).toBe(0);
    expect(result.likeToViewRatio).toBe(0);
    expect(Number.isNaN(result.engagementRate)).toBe(false);
    expect(Number.isNaN(result.likeToViewRatio)).toBe(false);
  });
});
