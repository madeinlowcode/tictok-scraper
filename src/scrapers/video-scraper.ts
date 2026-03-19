import type { TikTokWebClient } from '../clients/tiktok-web.js';
import type { TikTokBrowserClient } from '../clients/tiktok-browser.js';
import type { VideoOutput } from '../types/index.js';
import { parseVideo } from '../parsers/video-parser.js';
import { cleanVideoOutput } from '../processors/data-cleaner.js';
import { isShortUrl, resolveShortUrl, extractVideoId } from '../utils/url-resolver.js';
import { withFallback } from '../utils/with-fallback.js';
import { TIKTOK_BASE_URL } from '../config/constants.js';

interface VideoScrapeOptions {
  browserClient?: TikTokBrowserClient;
}

export async function scrapeVideo(
  webClient: TikTokWebClient,
  videoIdentifier: string,
  options: VideoScrapeOptions = {},
): Promise<VideoOutput> {
  let videoUrl = videoIdentifier;

  // Resolve short URLs
  if (isShortUrl(videoUrl)) {
    videoUrl = await resolveShortUrl(videoUrl);
  }

  // If just a videoId, build the URL
  if (/^\d+$/.test(videoUrl)) {
    videoUrl = `${TIKTOK_BASE_URL}/video/${videoUrl}`;
  }

  const layers: Array<() => Promise<VideoOutput>> = [
    // Layer 1: HTTP hydration
    async () => {
      const rawData = await webClient.fetchVideo(videoUrl);
      return cleanVideoOutput(parseVideo(rawData));
    },
  ];

  // Layer 3: Browser fallback (only if client provided)
  if (options.browserClient) {
    const browserClient = options.browserClient;
    layers.push(async () => {
      const rawData = await browserClient.fetchVideo(videoUrl);
      return cleanVideoOutput(parseVideo(rawData));
    });
  }

  return withFallback(layers);
}
