import type { TikTokApiClient } from '../clients/tiktok-api.js';
import type { VideoOutput } from '../types/index.js';
import { parseSearchResults } from '../parsers/search-parser.js';
import { cleanVideoOutput } from '../processors/data-cleaner.js';

interface SearchScrapeOptions {
  maxResults?: number;
  sortBy?: 'relevance' | 'likes' | 'date';
  region?: string;
}

export async function scrapeSearch(
  apiClient: TikTokApiClient,
  keyword: string,
  options: SearchScrapeOptions = {},
): Promise<VideoOutput[]> {
  const { maxResults = 20 } = options;

  const results: VideoOutput[] = [];
  let offset = 0;
  let hasMore = true;

  while (results.length < maxResults && hasMore) {
    const response = await apiClient.search(keyword, offset);

    const parsed = parseSearchResults(response.data);
    for (const video of parsed) {
      if (results.length >= maxResults) break;
      results.push(cleanVideoOutput(video));
    }

    offset += response.data.length;
    hasMore = response.has_more;
  }

  return results;
}
