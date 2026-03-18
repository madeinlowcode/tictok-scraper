import type { TikTokWebClient } from '../clients/tiktok-web.js';
import type { TikTokApiClient } from '../clients/tiktok-api.js';
import type { ProfileOutput, VideoOutput } from '../types/index.js';
import { parseProfile } from '../parsers/profile-parser.js';
import { parseVideo } from '../parsers/video-parser.js';
import { cleanProfileOutput, cleanVideoOutput } from '../processors/data-cleaner.js';
import { calculateEngagement } from '../processors/engagement-calculator.js';
import { extractUsername } from '../utils/url-resolver.js';

interface ProfileScrapeOptions {
  maxVideos?: number;
  includeEngagement?: boolean;
}

export async function scrapeProfile(
  webClient: TikTokWebClient,
  apiClient: TikTokApiClient,
  identifier: string,
  options: ProfileScrapeOptions = {},
): Promise<ProfileOutput> {
  const { maxVideos = 0, includeEngagement = false } = options;

  // Resolve identifier to username
  const username = extractUsername(identifier) ?? identifier.replace('@', '');

  // Layer 1: Fetch profile from hydration data
  const rawProfile = await webClient.fetchProfile(username);
  const profile = parseProfile(rawProfile);

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

  // Add engagement metrics if requested
  if (includeEngagement && videos.length > 0) {
    cleanedProfile.engagement = calculateEngagement(cleanedProfile, videos);
  }

  if (videos.length > 0) {
    cleanedProfile.recentVideos = videos;
  }

  return cleanedProfile;
}
