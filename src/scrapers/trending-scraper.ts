import type { TikTokApiClient } from '../clients/tiktok-api.js';
import type { TrendingOutput } from '../types/index.js';
import { DEFAULT_REGION } from '../config/constants.js';

interface TrendingScrapeOptions {
  region?: string;
  category?: string;
  period?: '7' | '30' | '120';
  maxItems?: number;
}

export async function scrapeTrending(
  apiClient: TikTokApiClient,
  options: TrendingScrapeOptions = {},
): Promise<TrendingOutput> {
  const {
    region = DEFAULT_REGION,
    category = 'All',
    period = '7',
    maxItems = 50,
  } = options;

  const response = await apiClient.getTrendingHashtags(region, period);

  const items = (response.data?.list ?? [])
    .slice(0, maxItems)
    .map((item) => ({
      rank: item.rank,
      rankChange: item.rank_change ?? 0,
      hashtag: item.hashtag_name,
      viewCount: item.view_count ?? 0,
      postCount: item.publish_cnt ?? 0,
      isNew: item.is_new ?? false,
      trendChart: item.trend_chart ?? [],
    }));

  return {
    region,
    category,
    items,
    scrapedAt: new Date().toISOString(),
  };
}
