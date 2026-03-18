import type { TikTokWebClient } from '../clients/tiktok-web.js';
import type { TikTokApiClient } from '../clients/tiktok-api.js';
import type { SoundOutput } from '../types/index.js';
import { parseSound } from '../parsers/sound-parser.js';

interface SoundScrapeOptions {
  maxVideos?: number;
}

export async function scrapeSound(
  webClient: TikTokWebClient,
  apiClient: TikTokApiClient,
  soundIdentifier: string,
  options: SoundScrapeOptions = {},
): Promise<SoundOutput> {
  // If it's a URL, use Layer 1 (hydration data)
  if (soundIdentifier.includes('tiktok.com/music/')) {
    const rawSound = await webClient.fetchSound(soundIdentifier);
    return parseSound(rawSound);
  }

  // For popular sounds, use Creative Center API
  const popularSounds = await apiClient.getPopularSounds();
  const match = popularSounds.find(
    (s) =>
      s.musicInfo?.music?.id === soundIdentifier ||
      s.musicInfo?.music?.title?.toLowerCase().includes(soundIdentifier.toLowerCase()),
  );

  if (match) {
    return parseSound(match);
  }

  // Fallback: try to build a music URL
  const fallbackUrl = `https://www.tiktok.com/music/${soundIdentifier}`;
  const rawSound = await webClient.fetchSound(fallbackUrl);
  return parseSound(rawSound);
}
