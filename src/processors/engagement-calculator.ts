import type { ProfileOutput, VideoOutput, EngagementMetrics } from '../types/index.js';

function safeRatio(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return numerator / denominator;
}

export function calculateEngagement(
  profile: ProfileOutput,
  videos: VideoOutput[],
): EngagementMetrics {
  if (videos.length === 0) {
    return {
      avgViews: 0,
      avgLikes: 0,
      avgComments: 0,
      avgShares: 0,
      engagementRate: 0,
      likeToViewRatio: 0,
      commentToViewRatio: 0,
      shareToViewRatio: 0,
      estimatedReach: 0,
    };
  }

  const totalViews = videos.reduce((sum, v) => sum + v.stats.playCount, 0);
  const totalLikes = videos.reduce((sum, v) => sum + v.stats.likeCount, 0);
  const totalComments = videos.reduce((sum, v) => sum + v.stats.commentCount, 0);
  const totalShares = videos.reduce((sum, v) => sum + v.stats.shareCount, 0);

  const count = videos.length;
  const avgViews = totalViews / count;
  const avgLikes = totalLikes / count;
  const avgComments = totalComments / count;
  const avgShares = totalShares / count;

  const engagementRate = safeRatio(totalLikes + totalComments + totalShares, totalViews) * 100;
  const likeToViewRatio = safeRatio(totalLikes, totalViews) * 100;
  const commentToViewRatio = safeRatio(totalComments, totalViews) * 100;
  const shareToViewRatio = safeRatio(totalShares, totalViews) * 100;

  const estimatedReach = safeRatio(avgViews, profile.followerCount) * profile.followerCount;

  return {
    avgViews: Math.round(avgViews),
    avgLikes: Math.round(avgLikes),
    avgComments: Math.round(avgComments),
    avgShares: Math.round(avgShares),
    engagementRate: Math.round(engagementRate * 100) / 100,
    likeToViewRatio: Math.round(likeToViewRatio * 100) / 100,
    commentToViewRatio: Math.round(commentToViewRatio * 100) / 100,
    shareToViewRatio: Math.round(shareToViewRatio * 100) / 100,
    estimatedReach: Math.round(estimatedReach),
  };
}
