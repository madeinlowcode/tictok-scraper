import type { VideoOutput, ProfileOutput, CommentOutput } from '../types/index.js';

function unixToISO(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString();
}

function cleanUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove common tracking params
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid'];
    for (const param of trackingParams) {
      parsed.searchParams.delete(param);
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

function nullifyZeroStat(value: number): number | null {
  // TikTok sometimes returns 0 when stats are hidden
  // We keep 0 as-is since we can't distinguish hidden from real zero
  // This function is a hook for future heuristic detection
  return value;
}

export function cleanVideoOutput(video: VideoOutput): VideoOutput {
  return {
    ...video,
    url: cleanUrl(video.url),
    coverUrl: video.coverUrl ? cleanUrl(video.coverUrl) : '',
    playUrl: video.playUrl ? cleanUrl(video.playUrl) : undefined,
    createTimeISO: video.createTimeISO || unixToISO(video.createTime),
    stats: {
      playCount: nullifyZeroStat(video.stats.playCount) ?? 0,
      likeCount: nullifyZeroStat(video.stats.likeCount) ?? 0,
      commentCount: nullifyZeroStat(video.stats.commentCount) ?? 0,
      shareCount: nullifyZeroStat(video.stats.shareCount) ?? 0,
      collectCount: nullifyZeroStat(video.stats.collectCount) ?? 0,
    },
    description: video.description?.trim() ?? '',
    locationCreated: video.locationCreated || undefined,
  };
}

export function cleanProfileOutput(profile: ProfileOutput): ProfileOutput {
  return {
    ...profile,
    avatarUrl: profile.avatarUrl ? cleanUrl(profile.avatarUrl) : '',
    bioLink: profile.bioLink ? cleanUrl(profile.bioLink) : undefined,
    bio: profile.bio?.trim() ?? '',
    nickname: profile.nickname?.trim() ?? '',
  };
}

export function cleanCommentOutput(comment: CommentOutput): CommentOutput {
  return {
    ...comment,
    text: comment.text?.trim() ?? '',
    createTimeISO: comment.createTimeISO || unixToISO(comment.createTime),
  };
}
