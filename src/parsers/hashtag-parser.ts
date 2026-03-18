import type { RawHashtagData, HashtagOutput } from '../types/index.js';
import { parseVideo } from './video-parser.js';

export function parseHashtag(raw: RawHashtagData): HashtagOutput {
  const challenge = raw.challengeInfo?.challenge;
  const stats = raw.challengeInfo?.stats;

  return {
    hashtagId: challenge?.id ?? '',
    name: challenge?.title ?? '',
    viewCount: stats?.viewCount ?? 0,
    videoCount: stats?.videoCount ?? 0,
    description: challenge?.desc ?? '',
    coverUrl: challenge?.coverLarger ?? '',
    videos: (raw.itemList ?? []).map(parseVideo),
    scrapedAt: new Date().toISOString(),
  };
}
