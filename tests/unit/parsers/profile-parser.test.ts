import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { parseProfile } from '../../../src/parsers/profile-parser.js';
import type { RawProfileData } from '../../../src/types/index.js';

function loadProfileFixture(): RawProfileData {
  const path = join(import.meta.dirname, '../../fixtures/hydration-profile.json');
  const fixture = JSON.parse(readFileSync(path, 'utf-8'));
  return fixture['__DEFAULT_SCOPE__']['webapp.user-detail'].userInfo;
}

describe('parseProfile', () => {
  it('should parse complete profile data correctly', () => {
    const raw = loadProfileFixture();
    const result = parseProfile(raw);

    expect(result.userId).toBe('6800000000000000001');
    expect(result.secUid).toBe('MS4wLjABAAAAsecuid123456789');
    expect(result.username).toBe('testuser');
    expect(result.nickname).toBe('Test User');
    expect(result.bio).toContain('Full-stack developer');
    expect(result.isVerified).toBe(true);
    expect(result.isPrivate).toBe(false);
    expect(result.followerCount).toBe(150000);
    expect(result.followingCount).toBe(500);
    expect(result.heartCount).toBe(3000000);
    expect(result.videoCount).toBe(120);
    expect(result.bioLink).toBe('https://testuser.dev');
    expect(result.region).toBe('BR');
    expect(result.scrapedAt).toBeDefined();
  });
});
