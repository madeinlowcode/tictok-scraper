import type { TikTokApiClient } from '../clients/tiktok-api.js';
import type { TikTokBrowserClient } from '../clients/tiktok-browser.js';
import type { VideoOutput } from '../types/index.js';
import { parseSearchResults } from '../parsers/search-parser.js';
import { cleanVideoOutput } from '../processors/data-cleaner.js';
import { withFallback } from '../utils/with-fallback.js';
import { TIKTOK_BASE_URL } from '../config/constants.js';

interface SearchScrapeOptions {
  maxResults?: number;
  sortBy?: 'relevance' | 'likes' | 'date';
  region?: string;
  browserClient?: TikTokBrowserClient;
}

export async function scrapeSearch(
  apiClient: TikTokApiClient,
  keyword: string,
  options: SearchScrapeOptions = {},
): Promise<VideoOutput[]> {
  const { maxResults = 20, browserClient } = options;

  const layers: Array<() => Promise<VideoOutput[]>> = [
    // Layer 2: API
    async () => {
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
    },
  ];

  // Layer 3: Browser fallback
  if (browserClient) {
    layers.push(async () => {
      const searchUrl = `${TIKTOK_BASE_URL}/search?q=${encodeURIComponent(keyword)}`;
      await browserClient.fetchVideo(searchUrl);
      return [];
    });
  }

  return withFallback(layers);
}
