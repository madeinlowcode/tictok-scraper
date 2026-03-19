import { Actor, log } from 'apify';
import { TikTokWebClient } from './clients/tiktok-web.js';
import { TikTokApiClient } from './clients/tiktok-api.js';
import { TikTokBrowserClient } from './clients/tiktok-browser.js';
import { scrapeVideo } from './scrapers/video-scraper.js';
import { scrapeProfile } from './scrapers/profile-scraper.js';
import { scrapeComments } from './scrapers/comment-scraper.js';
import { scrapeHashtag } from './scrapers/hashtag-scraper.js';
import { scrapeSearch } from './scrapers/search-scraper.js';
import { scrapeTrending } from './scrapers/trending-scraper.js';
import { scrapeSound } from './scrapers/sound-scraper.js';
import { detectInputType, isShortUrl, resolveShortUrl, extractVideoId } from './utils/url-resolver.js';
import { CookieManager } from './utils/cookie-manager.js';
import { SignatureGenerator } from './utils/signature-generator.js';
import { DEFAULT_REGION } from './config/constants.js';
import type { ScraperInput, CookieStore, CookiePool } from './types/index.js';

await Actor.init();

let browserClient: InstanceType<typeof TikTokBrowserClient> | null = null;

try {
  const input = (await Actor.getInput()) as ScraperInput | null;

  if (!input) {
    throw new Error('No input provided. Please provide URLs, search queries, or hashtags.');
  }

  const proxyConfiguration = await Actor.createProxyConfiguration({
    groups: ['RESIDENTIAL'],
  });

  const proxyUrl = await proxyConfiguration?.newUrl();

  // CookieStore backed by Apify KeyValueStore
  const kvStore = await Actor.openKeyValueStore();
  const cookieStore: CookieStore = {
    async load(): Promise<CookiePool | null> {
      return (await kvStore.getValue<CookiePool>('cookie-pool')) ?? null;
    },
    async save(pool: CookiePool): Promise<void> {
      await kvStore.setValue('cookie-pool', pool);
    },
  };

  const cookieManager = new CookieManager({ store: cookieStore });
  await cookieManager.initialize();

  const signatureGenerator = new SignatureGenerator({
    cookieProvider: cookieManager,
  });

  const webClient = new TikTokWebClient({ proxyUrl: proxyUrl ?? undefined });
  const apiClient = new TikTokApiClient(
    { proxyUrl: proxyUrl ?? undefined },
    { cookieManager, signatureGenerator },
  );
  browserClient = new TikTokBrowserClient({ proxyUrl: proxyUrl ?? undefined });

  const region = input.region ?? DEFAULT_REGION;
  const allResults: unknown[] = [];

  // Process URLs
  if (input.urls) {
    for (const rawUrl of input.urls) {
      try {
        let url = rawUrl;
        if (isShortUrl(url)) {
          url = await resolveShortUrl(url);
        }

        const inputType = detectInputType(url);

        switch (inputType) {
          case 'video': {
            const result = await scrapeVideo(webClient, url, { browserClient });
            allResults.push(result);
            await Actor.charge({ eventName: 'video-scraped', count: 1 });
            break;
          }
          case 'profile': {
            const result = await scrapeProfile(webClient, apiClient, url, {
              maxVideos: input.maxVideos ?? 30,
              includeEngagement: input.includeEngagement ?? false,
              browserClient,
            });
            allResults.push(result);
            await Actor.charge({ eventName: 'profile-scraped', count: 1 });

            if (input.includeComments && result.recentVideos) {
              for (const video of result.recentVideos.slice(0, 5)) {
                const comments = await scrapeComments(apiClient, video.videoId, {
                  maxComments: input.maxComments ?? 50,
                  browserClient,
                });
                allResults.push(...comments);
                await Actor.charge({ eventName: 'comment-scraped', count: comments.length });
              }
            }
            break;
          }
          case 'hashtag': {
            const result = await scrapeHashtag(webClient, apiClient, url, {
              maxVideos: input.maxVideos ?? 30,
              browserClient,
            });
            allResults.push(result);
            await Actor.charge({ eventName: 'hashtag-scraped', count: 1 });
            break;
          }
          case 'sound': {
            const result = await scrapeSound(webClient, apiClient, url, { browserClient });
            allResults.push(result);
            await Actor.charge({ eventName: 'sound-scraped', count: 1 });
            break;
          }
          default: {
            log.warning(`Unknown URL type: ${url}`);
          }
        }
      } catch (error) {
        log.error(`Failed to scrape URL: ${rawUrl}`, { error: String(error) });
      }
    }
  }

  // Process profiles
  if (input.profiles) {
    for (const profileId of input.profiles) {
      try {
        const result = await scrapeProfile(webClient, apiClient, profileId, {
          maxVideos: input.maxVideos ?? 30,
          includeEngagement: input.includeEngagement ?? false,
          browserClient,
        });
        allResults.push(result);
        await Actor.charge({ eventName: 'profile-scraped', count: 1 });
      } catch (error) {
        log.error(`Failed to scrape profile: ${profileId}`, { error: String(error) });
      }
    }
  }

  // Process hashtags
  if (input.hashtags) {
    for (const hashtag of input.hashtags) {
      try {
        const result = await scrapeHashtag(webClient, apiClient, hashtag, {
          maxVideos: input.maxVideos ?? 30,
          browserClient,
        });
        allResults.push(result);
        await Actor.charge({ eventName: 'hashtag-scraped', count: 1 });
      } catch (error) {
        log.error(`Failed to scrape hashtag: ${hashtag}`, { error: String(error) });
      }
    }
  }

  // Process search queries
  if (input.searchQueries) {
    for (const query of input.searchQueries) {
      try {
        const results = await scrapeSearch(apiClient, query, {
          maxResults: input.maxResults ?? 20,
          browserClient,
        });
        allResults.push(...results);
        await Actor.charge({ eventName: 'search-result', count: results.length });
      } catch (error) {
        log.error(`Failed to search: ${query}`, { error: String(error) });
      }
    }
  }

  // Process trending
  if (input.includeTrending) {
    try {
      const result = await scrapeTrending(apiClient, { region, browserClient });
      allResults.push(result);
      await Actor.charge({ eventName: 'trending-item', count: result.items.length });
    } catch (error) {
      log.error('Failed to scrape trending', { error: String(error) });
    }
  }

  // Push all results
  if (allResults.length > 0) {
    await Actor.pushData(allResults);
    log.info(`Successfully scraped ${allResults.length} items`);
  } else {
    log.warning('No results were scraped');
  }
} catch (error) {
  log.error('Actor failed', { error: String(error) });
  throw error;
} finally {
  if (browserClient) {
    await browserClient.dispose();
  }
  await Actor.exit();
}
