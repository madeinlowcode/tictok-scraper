import { describe, it, expect } from 'vitest';
import { extractVideoId, extractUsername, detectInputType, extractHashtag, isShortUrl } from '../../../src/utils/url-resolver.js';

describe('extractVideoId', () => {
  it('should extract video ID from full URL', () => {
    expect(extractVideoId('https://www.tiktok.com/@user/video/7312345678901234567')).toBe('7312345678901234567');
  });

  it('should extract video ID from URL with query params', () => {
    expect(extractVideoId('https://www.tiktok.com/@user/video/7312345678901234567?lang=en')).toBe('7312345678901234567');
  });

  it('should return null for non-video URL', () => {
    expect(extractVideoId('https://www.tiktok.com/@user')).toBeNull();
  });
});

describe('extractUsername', () => {
  it('should extract username from profile URL', () => {
    expect(extractUsername('https://www.tiktok.com/@johndoe')).toBe('johndoe');
  });

  it('should extract username from URL with query params', () => {
    expect(extractUsername('https://www.tiktok.com/@johndoe?lang=en')).toBe('johndoe');
  });

  it('should extract username from bare @handle', () => {
    expect(extractUsername('@johndoe')).toBe('johndoe');
  });

  it('should handle usernames with dots', () => {
    expect(extractUsername('https://www.tiktok.com/@john.doe')).toBe('john.doe');
  });
});

describe('extractHashtag', () => {
  it('should extract hashtag from URL', () => {
    expect(extractHashtag('https://www.tiktok.com/tag/coding')).toBe('coding');
  });

  it('should return null for non-hashtag URL', () => {
    expect(extractHashtag('https://www.tiktok.com/@user')).toBeNull();
  });
});

describe('isShortUrl', () => {
  it('should detect vm.tiktok.com URLs', () => {
    expect(isShortUrl('https://vm.tiktok.com/ZMabc123/')).toBe(true);
  });

  it('should not match regular URLs', () => {
    expect(isShortUrl('https://www.tiktok.com/@user')).toBe(false);
  });
});

describe('detectInputType', () => {
  it('should detect video URL', () => {
    expect(detectInputType('https://www.tiktok.com/@user/video/123')).toBe('video');
  });

  it('should detect profile URL', () => {
    expect(detectInputType('https://www.tiktok.com/@user')).toBe('profile');
  });

  it('should detect hashtag URL', () => {
    expect(detectInputType('https://www.tiktok.com/tag/dance')).toBe('hashtag');
  });

  it('should detect sound URL', () => {
    expect(detectInputType('https://www.tiktok.com/music/song-123')).toBe('sound');
  });

  it('should detect bare @username as profile', () => {
    expect(detectInputType('@johndoe')).toBe('profile');
  });

  it('should detect bare #hashtag as hashtag', () => {
    expect(detectInputType('#coding')).toBe('hashtag');
  });

  it('should default to keyword for plain text', () => {
    expect(detectInputType('cooking recipes')).toBe('keyword');
  });

  it('should detect short URL as video', () => {
    expect(detectInputType('https://vm.tiktok.com/ZMabc123/')).toBe('video');
  });
});
