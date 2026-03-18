import type { TikTokWebClient } from '../clients/tiktok-web.js';
import type { VideoOutput } from '../types/index.js';
import { parseVideo } from '../parsers/video-parser.js';
import { cleanVideoOutput } from '../processors/data-cleaner.js';
import { isShortUrl, resolveShortUrl, extractVideoId } from '../utils/url-resolver.js';
import { TIKTOK_BASE_URL } from '../config/constants.js';

export async function scrapeVideo(
  webClient: TikTokWebClient,
  videoIdentifier: string,
): Promise<VideoOutput> {
  let videoUrl = videoIdentifier;

  // Resolve short URLs
  if (isShortUrl(videoUrl)) {
    videoUrl = await resolveShortUrl(videoUrl);
  }

  // If just a videoId, build the URL (need a placeholder username, TikTok redirects)
  if (/^\d+$/.test(videoUrl)) {
    videoUrl = `${TIKTOK_BASE_URL}/video/${videoUrl}`;
  }

  const rawData = await webClient.fetchVideo(videoUrl);
  const parsed = parseVideo(rawData);
  return cleanVideoOutput(parsed);
}
