import type { TikTokWebClient } from '../clients/tiktok-web.js';
import type { TikTokApiClient } from '../clients/tiktok-api.js';
import type { TikTokBrowserClient } from '../clients/tiktok-browser.js';
import type { HashtagOutput } from '../types/index.js';
import { parseHashtag } from '../parsers/hashtag-parser.js';
import { cleanVideoOutput } from '../processors/data-cleaner.js';
import { withFallback } from '../utils/with-fallback.js';

interface HashtagScrapeOptions {
  maxVideos?: number;
  browserClient?: TikTokBrowserClient;
}

export async function scrapeHashtag(
  webClient: TikTokWebClient,
  apiClient: TikTokApiClient,
  hashtag: string,
  options: HashtagScrapeOptions = {},
): Promise<HashtagOutput> {
  const { maxVideos = 30, browserClient } = options;

  const layers: Array<() => Promise<HashtagOutput>> = [
    // Layer 1: HTTP hydration
    async () => {
      const rawHashtag = await webClient.fetchHashtag(hashtag);
      return parseHashtag(rawHashtag);
    },
  ];

  // Layer 3: Browser fallback
  if (browserClient) {
    layers.push(async () => {
      const rawHashtag = await browserClient.fetchHashtag(hashtag);
      return parseHashtag(rawHashtag);
    });
  }

  const result = await withFallback(layers);

  if (result.videos.length > maxVideos) {
    result.videos = result.videos.slice(0, maxVideos);
  }

  result.videos = result.videos.map(cleanVideoOutput);

  return result;
}
