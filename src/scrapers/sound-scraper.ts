import type { TikTokWebClient } from '../clients/tiktok-web.js';
import type { TikTokApiClient } from '../clients/tiktok-api.js';
import type { TikTokBrowserClient } from '../clients/tiktok-browser.js';
import type { SoundOutput } from '../types/index.js';
import { parseSound } from '../parsers/sound-parser.js';
import { withFallback } from '../utils/with-fallback.js';

interface SoundScrapeOptions {
  maxVideos?: number;
  browserClient?: TikTokBrowserClient;
}

export async function scrapeSound(
  webClient: TikTokWebClient,
  apiClient: TikTokApiClient,
  soundIdentifier: string,
  options: SoundScrapeOptions = {},
): Promise<SoundOutput> {
  const { browserClient } = options;

  const layers: Array<() => Promise<SoundOutput>> = [];

  if (soundIdentifier.includes('tiktok.com/music/')) {
    // Layer 1: HTTP hydration for music URL
    layers.push(async () => {
      const rawSound = await webClient.fetchSound(soundIdentifier);
      return parseSound(rawSound);
    });
  }

  // Layer 2: Creative Center API for popular sounds lookup
  layers.push(async () => {
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
  });

  // Layer 3: Browser fallback
  if (browserClient) {
    const musicUrl = soundIdentifier.includes('tiktok.com/music/')
      ? soundIdentifier
      : `https://www.tiktok.com/music/${soundIdentifier}`;
    layers.push(async () => {
      const rawSound = await browserClient.fetchSound(musicUrl);
      return parseSound(rawSound);
    });
  }

  return withFallback(layers);
}
