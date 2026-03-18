import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { parseVideo } from '../../../src/parsers/video-parser.js';
import type { RawVideoData } from '../../../src/types/index.js';

function loadVideoFixture(): RawVideoData {
  const path = join(import.meta.dirname, '../../fixtures/hydration-video.json');
  const fixture = JSON.parse(readFileSync(path, 'utf-8'));
  return fixture['__DEFAULT_SCOPE__']['webapp.video-detail'].itemInfo.itemStruct;
}

describe('parseVideo', () => {
  it('should parse complete video data correctly', () => {
    const raw = loadVideoFixture();
    const result = parseVideo(raw);

    expect(result.videoId).toBe('7312345678901234567');
    expect(result.description).toContain('Testing TikTok');
    expect(result.duration).toBe(30);
    expect(result.createTime).toBe(1710700800);
    expect(result.createTimeISO).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(result.stats.playCount).toBe(500000);
    expect(result.stats.likeCount).toBe(15000);
    expect(result.stats.commentCount).toBe(300);
    expect(result.stats.shareCount).toBe(500);
    expect(result.stats.collectCount).toBe(2000);
    expect(result.hashtags).toEqual(['coding', 'tech']);
    expect(result.author.username).toBe('testuser');
    expect(result.author.isVerified).toBe(true);
    expect(result.music.title).toBe('Original Sound');
    expect(result.music.isOriginal).toBe(true);
    expect(result.isAd).toBe(false);
    expect(result.locationCreated).toBe('BR');
    expect(result.scrapedAt).toBeDefined();
  });

  it('should be a pure function returning same output for same input', () => {
    const raw = loadVideoFixture();
    const result1 = parseVideo(raw);
    const result2 = parseVideo(raw);

    // Compare all fields except scrapedAt (timestamp varies)
    expect(result1.videoId).toBe(result2.videoId);
    expect(result1.description).toBe(result2.description);
    expect(result1.stats).toEqual(result2.stats);
  });

  it('should handle missing optional fields gracefully', () => {
    const raw: RawVideoData = {
      id: '123',
      desc: '',
      createTime: 0,
      video: { duration: 0, cover: '', playAddr: '' },
      stats: { diggCount: 0, shareCount: 0, commentCount: 0, playCount: 0, collectCount: 0 },
      author: { id: '', uniqueId: '', nickname: '', avatarLarger: '', verified: false },
      music: { id: '', title: '', authorName: '', album: '', original: false, duration: 0, coverLarge: '', playUrl: '' },
      isAd: false,
    };

    const result = parseVideo(raw);
    expect(result.videoId).toBe('123');
    expect(result.hashtags).toEqual([]);
    expect(result.playUrl).toBeUndefined();
    expect(result.locationCreated).toBeUndefined();
  });
});
