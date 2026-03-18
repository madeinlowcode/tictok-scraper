// ============================================================
// Output Types — Structured data returned by scrapers
// ============================================================

export interface VideoOutput {
  videoId: string;
  url: string;
  description: string;
  createTime: number;
  createTimeISO: string;
  duration: number;
  coverUrl: string;
  playUrl?: string;
  stats: {
    playCount: number;
    likeCount: number;
    commentCount: number;
    shareCount: number;
    collectCount: number;
  };
  hashtags: string[];
  author: {
    userId: string;
    username: string;
    nickname: string;
    avatarUrl: string;
    isVerified: boolean;
  };
  music: {
    musicId: string;
    title: string;
    authorName: string;
    albumName: string;
    isOriginal: boolean;
    duration: number;
    coverUrl: string;
  };
  isAd: boolean;
  locationCreated?: string;
  scrapedAt: string;
}

export interface ProfileOutput {
  userId: string;
  secUid: string;
  username: string;
  nickname: string;
  bio: string;
  avatarUrl: string;
  isVerified: boolean;
  isPrivate: boolean;
  followerCount: number;
  followingCount: number;
  heartCount: number;
  videoCount: number;
  bioLink?: string;
  region: string;
  engagement?: EngagementMetrics;
  recentVideos?: VideoOutput[];
  scrapedAt: string;
}

export interface CommentOutput {
  commentId: string;
  text: string;
  author: {
    userId: string;
    username: string;
    nickname: string;
    avatarUrl: string;
  };
  likeCount: number;
  replyCount: number;
  createTime: number;
  createTimeISO: string;
  isAuthorLiked: boolean;
  scrapedAt: string;
}

export interface HashtagOutput {
  hashtagId: string;
  name: string;
  viewCount: number;
  videoCount: number;
  description: string;
  coverUrl: string;
  videos: VideoOutput[];
  scrapedAt: string;
}

export interface TrendingItem {
  rank: number;
  rankChange: number;
  hashtag: string;
  viewCount: number;
  postCount: number;
  isNew: boolean;
  trendChart: number[];
}

export interface TrendingOutput {
  region: string;
  category: string;
  items: TrendingItem[];
  scrapedAt: string;
}

export interface SoundOutput {
  musicId: string;
  title: string;
  authorName: string;
  albumName: string;
  duration: number;
  isOriginal: boolean;
  coverUrl: string;
  playUrl: string;
  videoCount: number;
  videos?: VideoOutput[];
  scrapedAt: string;
}

// ============================================================
// Engagement Metrics
// ============================================================

export interface EngagementMetrics {
  avgViews: number;
  avgLikes: number;
  avgComments: number;
  avgShares: number;
  engagementRate: number;
  likeToViewRatio: number;
  commentToViewRatio: number;
  shareToViewRatio: number;
  estimatedReach: number;
}

// ============================================================
// Raw Data Types — Internal data before parsing
// ============================================================

export interface RawVideoData {
  id: string;
  desc: string;
  createTime: number;
  video: {
    duration: number;
    cover: string;
    playAddr: string;
  };
  stats: {
    diggCount: number;
    shareCount: number;
    commentCount: number;
    playCount: number;
    collectCount: number;
  };
  author: {
    uniqueId: string;
    nickname: string;
    id: string;
    avatarLarger: string;
    verified: boolean;
  };
  music: {
    id: string;
    title: string;
    authorName: string;
    album: string;
    original: boolean;
    duration: number;
    coverLarge: string;
    playUrl: string;
  };
  challenges?: Array<{ id: string; title: string }>;
  isAd: boolean;
  locationCreated?: string;
  [key: string]: unknown;
}

export interface RawProfileData {
  user: {
    id: string;
    secUid: string;
    uniqueId: string;
    nickname: string;
    signature: string;
    verified: boolean;
    privateAccount: boolean;
    avatarLarger: string;
    bioLink?: { link: string };
    region: string;
  };
  stats: {
    followerCount: number;
    followingCount: number;
    heartCount: number;
    videoCount: number;
  };
}

export interface RawHashtagData {
  challengeInfo: {
    challenge: {
      id: string;
      title: string;
      desc: string;
      coverLarger: string;
    };
    stats: {
      viewCount: number;
      videoCount: number;
    };
  };
  itemList?: RawVideoData[];
}

export interface RawCommentData {
  cid: string;
  text: string;
  create_time: number;
  digg_count: number;
  reply_comment_total: number;
  is_author_digged: boolean;
  user: {
    uid: string;
    unique_id: string;
    nickname: string;
    avatar_larger: string;
  };
}

export interface RawSearchResponse {
  data: RawVideoData[];
  has_more: boolean;
  cursor: string;
}

export interface RawSoundData {
  musicInfo: {
    music: {
      id: string;
      title: string;
      authorName: string;
      album: string;
      duration: number;
      original: boolean;
      coverLarge: string;
      playUrl: string;
    };
    stats: {
      videoCount: number;
    };
  };
}

export interface RawTrendingResponse {
  data: {
    list: Array<{
      hashtag_name: string;
      rank: number;
      rank_change: number;
      view_count: number;
      publish_cnt: number;
      is_new: boolean;
      trend_chart: number[];
    }>;
  };
}

export interface RawVideoListResponse {
  itemList: RawVideoData[];
  hasMore: boolean;
  cursor: string;
}

export interface RawCommentListResponse {
  comments: RawCommentData[];
  has_more: boolean;
  cursor: number;
  total: number;
}

// ============================================================
// Input & Config Types
// ============================================================

export interface ScraperInput {
  urls?: string[];
  searchQueries?: string[];
  hashtags?: string[];
  profiles?: string[];
  maxResults?: number;
  maxComments?: number;
  maxVideos?: number;
  region?: string;
  includeTrending?: boolean;
  includeEngagement?: boolean;
  includeComments?: boolean;
}

export interface PaginationResult<T> {
  items: T[];
  cursor: string;
  hasMore: boolean;
}

export interface ClientConfig {
  proxyUrl?: string;
  cookies?: Record<string, string>;
  timeout?: number;
  maxRetries?: number;
}

export type InputType = 'profile' | 'video' | 'hashtag' | 'sound' | 'keyword';

// ============================================================
// Custom Error Types
// ============================================================

export class TikTokError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TikTokError';
  }
}

export class ProfileNotFoundError extends TikTokError {
  constructor(identifier: string) {
    super(`Profile not found: ${identifier}`);
    this.name = 'ProfileNotFoundError';
  }
}

export class VideoNotFoundError extends TikTokError {
  constructor(identifier: string) {
    super(`Video not found: ${identifier}`);
    this.name = 'VideoNotFoundError';
  }
}

export class RateLimitError extends TikTokError {
  constructor(endpoint: string) {
    super(`Rate limited on: ${endpoint}`);
    this.name = 'RateLimitError';
  }
}

export class HydrationExtractionError extends TikTokError {
  constructor(reason: string) {
    super(`Hydration extraction failed: ${reason}`);
    this.name = 'HydrationExtractionError';
  }
}
