import type { TikTokWebClient } from '../clients/tiktok-web.js';
import type { TikTokApiClient } from '../clients/tiktok-api.js';
import type { TikTokBrowserClient } from '../clients/tiktok-browser.js';
import type { ProfileOutput, VideoOutput } from '../types/index.js';
import { parseProfile } from '../parsers/profile-parser.js';
import { parseVideo } from '../parsers/video-parser.js';
import { cleanProfileOutput, cleanVideoOutput } from '../processors/data-cleaner.js';
import { calculateEngagement } from '../processors/engagement-calculator.js';
import { extractUsername } from '../utils/url-resolver.js';
import { withFallback } from '../utils/with-fallback.js';

interface ProfileScrapeOptions {
  maxVideos?: number;
  includeEngagement?: boolean;
  browserClient?: TikTokBrowserClient;
}

export async function scrapeProfile(
  webClient: TikTokWebClient,
  apiClient: TikTokApiClient,
  identifier: string,
  options: ProfileScrapeOptions = {},
): Promise<ProfileOutput> {
  const { maxVideos = 0, includeEngagement = false, browserClient } = options;
  const username = extractUsername(identifier) ?? identifier.replace('@', '');

  // Build fallback layers for initial profile data
  const layers: Array<() => Promise<ProfileOutput>> = [
    // Layer 1: HTTP hydration
    async () => {
      const rawProfile = await webClient.fetchProfile(username);
      return parseProfile(rawProfile);
    },
  ];

  // Layer 3: Browser fallback
  if (browserClient) {
    layers.push(async () => {
      const rawProfile = await browserClient.fetchProfile(username);
      const profile = parseProfile(rawProfile);

      // Extract tokens and inject into HTTP clients
      const tokenStore = await browserClient.getTokenStore();
      webClient.setTokenStore(tokenStore);
      apiClient.setTokenStore(tokenStore);

      return profile;
    });
  }

  const profile = await withFallback(layers);

  // Collect videos if requested
  const videos: VideoOutput[] = [];

  if (maxVideos > 0 && profile.secUid) {
    let cursor: string | undefined;
    let hasMore = true;

    while (videos.length < maxVideos && hasMore) {
      const response = await apiClient.getProfileVideos(profile.secUid, cursor);

      for (const rawVideo of response.itemList) {
        if (videos.length >= maxVideos) break;
        videos.push(cleanVideoOutput(parseVideo(rawVideo)));
      }

      cursor = response.cursor;
      hasMore = response.hasMore;
    }
  }

  const cleanedProfile = cleanProfileOutput(profile);

  if (includeEngagement && videos.length > 0) {
    cleanedProfile.engagement = calculateEngagement(cleanedProfile, videos);
  }

  if (videos.length > 0) {
    cleanedProfile.recentVideos = videos;
  }

  return cleanedProfile;
}
