import type { TikTokApiClient } from '../clients/tiktok-api.js';
import type { CommentOutput } from '../types/index.js';
import { parseComment } from '../parsers/comment-parser.js';
import { cleanCommentOutput } from '../processors/data-cleaner.js';

interface CommentScrapeOptions {
  maxComments?: number;
}

export async function scrapeComments(
  apiClient: TikTokApiClient,
  videoId: string,
  options: CommentScrapeOptions = {},
): Promise<CommentOutput[]> {
  const { maxComments = 100 } = options;

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
}
