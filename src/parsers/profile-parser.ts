import type { RawProfileData, ProfileOutput } from '../types/index.js';

export function parseProfile(raw: RawProfileData): ProfileOutput {
  return {
    userId: raw.user.id,
    secUid: raw.user.secUid,
    username: raw.user.uniqueId,
    nickname: raw.user.nickname,
    bio: raw.user.signature ?? '',
    avatarUrl: raw.user.avatarLarger ?? '',
    isVerified: raw.user.verified ?? false,
    isPrivate: raw.user.privateAccount ?? false,
    followerCount: raw.stats.followerCount ?? 0,
    followingCount: raw.stats.followingCount ?? 0,
    heartCount: raw.stats.heartCount ?? 0,
    videoCount: raw.stats.videoCount ?? 0,
    bioLink: raw.user.bioLink?.link || undefined,
    region: raw.user.region ?? '',
    scrapedAt: new Date().toISOString(),
  };
}
