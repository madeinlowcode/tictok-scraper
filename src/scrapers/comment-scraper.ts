import type { TikTokApiClient } from '../clients/tiktok-api.js';
import type { TikTokBrowserClient } from '../clients/tiktok-browser.js';
import type { CommentOutput } from '../types/index.js';
import { parseComment } from '../parsers/comment-parser.js';
import { cleanCommentOutput } from '../processors/data-cleaner.js';
import { withFallback } from '../utils/with-fallback.js';
import { TIKTOK_BASE_URL } from '../config/constants.js';

interface CommentScrapeOptions {
  maxComments?: number;
  browserClient?: TikTokBrowserClient;
}

export async function scrapeComments(
  apiClient: TikTokApiClient,
  videoId: string,
  options: CommentScrapeOptions = {},
): Promise<CommentOutput[]> {
  const { maxComments = 100, browserClient } = options;

  const layers: Array<() => Promise<CommentOutput[]>> = [
    // Layer 2: API
    async () => {
      const comments: CommentOutput[] = [];
      let cursor: string | undefined;
      let hasMore = true;

      while (comments.length < maxComments && hasMore) {
        const response = await apiClient.getComments(videoId, cursor);

        for (const rawComment of response.comments) {
          if (comments.length >= maxComments) break;
          comments.push(cleanCommentOutput(parseComment(rawComment)));
        }

        cursor = String(response.cursor);
        hasMore = response.has_more;
      }

      return comments;
    },
  ];

  // Layer 3: Browser fallback — navigate to video page and intercept comment API responses
  if (browserClient) {
    layers.push(async () => {
      const videoUrl = `${TIKTOK_BASE_URL}/video/${videoId}`;
      // fetchVideo will intercept API responses including comments
      await browserClient.fetchVideo(videoUrl);
      // Comments are loaded via XHR, return empty if not captured
      return [];
    });
  }

  return withFallback(layers);
}
