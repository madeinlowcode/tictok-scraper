import type { TikTokWebClient } from '../clients/tiktok-web.js';
import type { TikTokApiClient } from '../clients/tiktok-api.js';
import type { HashtagOutput, VideoOutput } from '../types/index.js';
import { parseHashtag } from '../parsers/hashtag-parser.js';
import { parseVideo } from '../parsers/video-parser.js';
import { cleanVideoOutput } from '../processors/data-cleaner.js';

interface HashtagScrapeOptions {
  maxVideos?: number;
}

export async function scrapeHashtag(
  webClient: TikTokWebClient,
  apiClient: TikTokApiClient,
  hashtag: string,
  options: HashtagScrapeOptions = {},
): Promise<HashtagOutput> {
  const { maxVideos = 30 } = options;

  // Layer 1: Fetch hashtag page for initial data
  const rawHashtag = await webClient.fetchHashtag(hashtag);
  const result = parseHashtag(rawHashtag);

  // If we need more videos than hydration provided, paginate via API
  // Note: TikTok hashtag API pagination requires challenge ID
  // For now, return what hydration provides
  if (result.videos.length > maxVideos) {
    result.videos = result.videos.slice(0, maxVideos);
  }

  result.videos = result.videos.map(cleanVideoOutput);

  return result;
}
