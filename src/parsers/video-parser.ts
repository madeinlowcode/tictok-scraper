import type { RawVideoData, VideoOutput } from '../types/index.js';

function unixToISO(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString();
}

export function parseVideo(raw: RawVideoData): VideoOutput {
  return {
    videoId: raw.id,
    url: `https://www.tiktok.com/@${raw.author?.uniqueId}/video/${raw.id}`,
    description: raw.desc ?? '',
    createTime: raw.createTime,
    createTimeISO: unixToISO(raw.createTime),
    duration: raw.video?.duration ?? 0,
    coverUrl: raw.video?.cover ?? '',
    playUrl: raw.video?.playAddr || undefined,
    stats: {
      playCount: raw.stats?.playCount ?? 0,
      likeCount: raw.stats?.diggCount ?? 0,
      commentCount: raw.stats?.commentCount ?? 0,
      shareCount: raw.stats?.shareCount ?? 0,
      collectCount: raw.stats?.collectCount ?? 0,
    },
    hashtags: (raw.challenges ?? []).map((c) => c.title),
    author: {
      userId: raw.author?.id ?? '',
      username: raw.author?.uniqueId ?? '',
      nickname: raw.author?.nickname ?? '',
      avatarUrl: raw.author?.avatarLarger ?? '',
      isVerified: raw.author?.verified ?? false,
    },
    music: {
      musicId: raw.music?.id ?? '',
      title: raw.music?.title ?? '',
      authorName: raw.music?.authorName ?? '',
      albumName: raw.music?.album ?? '',
      isOriginal: raw.music?.original ?? false,
      duration: raw.music?.duration ?? 0,
      coverUrl: raw.music?.coverLarge ?? '',
    },
    isAd: raw.isAd ?? false,
    locationCreated: raw.locationCreated || undefined,
    scrapedAt: new Date().toISOString(),
  };
}
