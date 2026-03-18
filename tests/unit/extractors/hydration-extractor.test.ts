import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  extractHydrationData,
  extractVideoFromHydration,
  extractProfileFromHydration,
  extractHashtagFromHydration,
} from '../../../src/extractors/hydration-extractor.js';
import { HydrationExtractionError } from '../../../src/types/index.js';

function loadFixture(name: string): Record<string, unknown> {
  const path = join(import.meta.dirname, '../../fixtures', name);
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function wrapInHtml(json: Record<string, unknown>): string {
  return `
    <html><body>
      <script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application/json">
        ${JSON.stringify(json)}
      </script>
    </body></html>
  `;
}

describe('extractHydrationData', () => {
  it('should extract __DEFAULT_SCOPE__ from valid HTML', () => {
    const fixture = loadFixture('hydration-video.json');
    const html = wrapInHtml(fixture);
    const result = extractHydrationData(html);

    expect(result).toBeDefined();
    expect(result['webapp.video-detail']).toBeDefined();
  });

  it('should throw when script tag is missing', () => {
    const html = '<html><body><p>No script here</p></body></html>';

    expect(() => extractHydrationData(html)).toThrow(HydrationExtractionError);
    expect(() => extractHydrationData(html)).toThrow('not found');
  });

  it('should throw on malformed JSON', () => {
    const html = `
      <html><body>
        <script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application/json">
          { invalid json }
        </script>
      </body></html>
    `;

    expect(() => extractHydrationData(html)).toThrow(HydrationExtractionError);
    expect(() => extractHydrationData(html)).toThrow('Failed to parse');
  });

  it('should throw when __DEFAULT_SCOPE__ is missing', () => {
    const html = wrapInHtml({ otherKey: 'value' });

    expect(() => extractHydrationData(html)).toThrow(HydrationExtractionError);
    expect(() => extractHydrationData(html)).toThrow('__DEFAULT_SCOPE__');
  });
});

describe('extractVideoFromHydration', () => {
  it('should extract video data from hydration', () => {
    const fixture = loadFixture('hydration-video.json');
    const scope = fixture['__DEFAULT_SCOPE__'] as Record<string, unknown>;

    const result = extractVideoFromHydration(scope);

    expect(result).toBeDefined();
    expect(result.id).toBe('7312345678901234567');
    expect(result.desc).toContain('Testing TikTok');
    expect(result.author.uniqueId).toBe('testuser');
  });

  it('should throw when video detail is missing', () => {
    expect(() => extractVideoFromHydration({})).toThrow(HydrationExtractionError);
  });
});

describe('extractProfileFromHydration', () => {
  it('should extract profile data from hydration', () => {
    const fixture = loadFixture('hydration-profile.json');
    const scope = fixture['__DEFAULT_SCOPE__'] as Record<string, unknown>;

    const result = extractProfileFromHydration(scope);

    expect(result).toBeDefined();
    expect(result.user.uniqueId).toBe('testuser');
    expect(result.stats.followerCount).toBe(150000);
  });

  it('should throw when profile detail is missing', () => {
    expect(() => extractProfileFromHydration({})).toThrow(HydrationExtractionError);
  });
});

describe('extractHashtagFromHydration', () => {
  it('should extract hashtag data from hydration', () => {
    const fixture = loadFixture('hydration-hashtag.json');
    const scope = fixture['__DEFAULT_SCOPE__'] as Record<string, unknown>;

    const result = extractHashtagFromHydration(scope);

    expect(result).toBeDefined();
    expect(result.challengeInfo.challenge.title).toBe('coding');
    expect(result.challengeInfo.stats.viewCount).toBe(50000000000);
  });

  it('should throw when hashtag detail is missing', () => {
    expect(() => extractHashtagFromHydration({})).toThrow(HydrationExtractionError);
  });
});
