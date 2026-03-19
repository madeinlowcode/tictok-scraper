## 1. Types and Interfaces

- [x] 1.1 Define `TokenStore` interface in `src/types/index.ts` with fields: `ttWebId?: string`, `msToken?: string`, `ttChainToken?: string`, `ttwid?: string`, `cookies: Record<string, string>`, and `extractedAt: number` (timestamp)
- [x] 1.2 Define `TokenStoreOptions` with `maxAgeMs` (default 30 minutes) for staleness checking
- [x] 1.3 Add `BrowserClientOptions` interface with optional `proxyUrl: string` field

## 2. withFallback Utility

- [x] 2.1 Create `src/utils/with-fallback.ts` with `withFallback<T>(layers: Array<() => Promise<T>>): Promise<T>` function
- [x] 2.2 Implement sequential layer execution: try each layer in order, catch errors, proceed to next layer on failure
- [x] 2.3 Return result from the first successful layer without calling subsequent layers
- [x] 2.4 Throw an aggregate error containing all individual layer errors when all layers fail
- [x] 2.5 Create `tests/unit/with-fallback.test.ts` with tests for: first layer succeeds, first fails and second succeeds, all layers fail with aggregate error, single layer success, single layer failure

## 3. TokenStore Utilities

- [x] 3.1 Create `src/utils/token-store.ts` with `createTokenStore(cookies: Record<string, string>): TokenStore` factory function that sets `extractedAt` to current timestamp
- [x] 3.2 Add `isTokenStoreValid(store: TokenStore, maxAgeMs?: number): boolean` function that checks if the store is within the max age (default 30 minutes)
- [x] 3.3 Add `tokensToCookieHeader(store: TokenStore): string` function that formats tokens as a Cookie header string
- [x] 3.4 Create `tests/unit/token-store.test.ts` with tests for: creation sets timestamp, validity check within window, validity check expired, cookie header formatting, handling of missing optional tokens

## 4. TikTok Browser Client

- [x] 4.1 Create `src/clients/tiktok-browser.ts` with `TikTokBrowserClient` class
- [x] 4.2 Implement lazy browser initialization: constructor stores config only, browser launches on first fetch call
- [x] 4.3 Implement response interceptor registration on Playwright page that captures responses matching TikTok API URL patterns (`/api/post/item_list/`, `/api/comment/list/`, `/api/search/`, `/api/` prefix) and parses them as JSON
- [x] 4.4 Implement filtering to ignore non-API responses (CSS, images, tracking pixels) based on URL pattern and content-type
- [x] 4.5 Implement `fetchVideo(videoUrl: string)` method that navigates to the video URL, waits for hydration data or API responses, and returns extracted video data as structured JSON
- [x] 4.6 Implement `fetchProfile(username: string)` method that navigates to `https://www.tiktok.com/@username`, intercepts API responses, and returns profile data
- [x] 4.7 Implement `fetchHashtag(hashtag: string)` method that navigates to `https://www.tiktok.com/tag/hashtag` and returns extracted hashtag data
- [x] 4.8 Implement `fetchSound(musicUrl: string)` method that navigates to the music URL and returns extracted sound data
- [x] 4.9 Implement `getTokenStore(): TokenStore` method that extracts cookies (`tt_webid`, `msToken`, `tt_chain_token`, `ttwid`) from browser context via `page.context().cookies()` after page load
- [x] 4.10 Handle missing cookies gracefully: `TokenStore` contains only cookies that were present, missing ones as `undefined`
- [x] 4.11 Implement browser instance reuse across multiple fetch calls within the same run
- [x] 4.12 Implement `dispose()` method that terminates the browser process and frees resources
- [x] 4.13 Implement optional `proxyUrl` support, configuring the browser context to route traffic through the specified proxy
- [x] 4.14 Ensure no Apify SDK imports exist in the file (only Crawlee's `PlaywrightCrawler`)

## 5. HTTP Clients Token Injection

- [x] 5.1 Add `setTokenStore(store: TokenStore): void` method to `TikTokWebClient` in `src/clients/tiktok-web.ts`
- [x] 5.2 Modify `TikTokWebClient` fetch methods to include `tt_webid`, `msToken`, and other tokens as Cookie headers when a valid (non-expired) `TokenStore` is set
- [x] 5.3 Skip token injection when `TokenStore` extraction timestamp is older than 30 minutes
- [x] 5.4 Add `setTokenStore(store: TokenStore): void` method to `TikTokApiClient` in `src/clients/tiktok-api.ts`
- [x] 5.5 Modify `TikTokApiClient` methods to include `msToken` in API request parameters when a valid `TokenStore` is set
- [x] 5.6 Skip token injection in API client when `TokenStore` is stale
- [x] 5.7 Create `tests/unit/token-injection.test.ts` with tests for: web client includes tokens in headers, API client includes msToken in params, stale tokens are not injected

## 6. Scraper Modules Fallback Integration

- [x] 6.1 Modify `scrapeVideo` in `src/scrapers/video-scraper.ts` to accept an optional `browserClient` parameter and use `withFallback` to try Layer 1, then Layer 3 on failure
- [x] 6.2 Modify `scrapeProfile` in `src/scrapers/profile-scraper.ts` to accept an optional `browserClient` parameter and use `withFallback` to try Layer 1 → Layer 2 → Layer 3
- [x] 6.3 After successful browser fallback in `scrapeProfile`, extract `TokenStore` from browser client and inject it into web and API clients for subsequent requests
- [x] 6.4 Modify `scrapeComments` in `src/scrapers/comment-scraper.ts` to accept an optional `browserClient` parameter and use `withFallback` to try Layer 2 → Layer 3 (browser navigates to video page and intercepts comment API responses)
- [x] 6.5 Modify `scrapeHashtag` in `src/scrapers/hashtag-scraper.ts` to accept an optional `browserClient` parameter and use `withFallback` to try Layer 1 → Layer 2 → Layer 3
- [x] 6.6 Modify `scrapeSearch` in `src/scrapers/search-scraper.ts` to accept an optional `browserClient` parameter and use `withFallback` to try Layer 2 → Layer 3 (browser navigates to TikTok search and intercepts search API responses)
- [x] 6.7 Modify `scrapeTrending` in `src/scrapers/trending-scraper.ts` to accept an optional `browserClient` parameter and use `withFallback` to try Creative Center API → Layer 3 (browser navigates to Creative Center page)
- [x] 6.8 Modify `scrapeSound` in `src/scrapers/sound-scraper.ts` to accept an optional `browserClient` parameter and use `withFallback` to try Layer 1 → Creative Center API → Layer 3

## 7. Main Entry Point Integration

- [x] 7.1 Update `src/main.ts` to create a `TikTokBrowserClient` instance (without launching browser) and pass it to all scraper modules
- [x] 7.2 Ensure the browser client receives proxy configuration from Apify's `ProxyConfiguration` when available
- [x] 7.3 Call `browserClient.dispose()` in the Actor's exit handler to ensure browser cleanup

## 8. Tests for Browser Client

- [x] 8.1 Create `tests/unit/tiktok-browser-client.test.ts`
- [x] 8.2 Add test: browser is NOT launched on construction (lazy initialization)
- [x] 8.3 Add test: `fetchVideo` navigates to correct URL and returns intercepted API data (mocked Playwright context)
- [x] 8.4 Add test: `fetchProfile` navigates to `https://www.tiktok.com/@username` and returns profile data
- [x] 8.5 Add test: XHR interceptor captures responses matching `/api/` URL patterns and ignores non-API responses
- [x] 8.6 Add test: `getTokenStore` returns `TokenStore` with extracted cookies after page load
- [x] 8.7 Add test: `getTokenStore` handles missing cookies gracefully (undefined for absent tokens)
- [x] 8.8 Add test: browser instance is reused across multiple fetch calls
- [x] 8.9 Add test: `dispose` terminates the browser process

## 9. Tests for Scraper Fallback Logic

- [x] 9.1 Create `tests/unit/scraper-fallback.test.ts`
- [x] 9.2 Add test: video scraper uses Layer 1 when it succeeds, does not invoke browser client
- [x] 9.3 Add test: video scraper falls back to browser client when Layer 1 fails
- [x] 9.4 Add test: profile scraper escalates Layer 1 → Layer 2 → Layer 3 correctly
- [x] 9.5 Add test: comment scraper falls back to browser client when Layer 2 fails
- [x] 9.6 Add test: search scraper falls back to browser client when Layer 2 fails
- [x] 9.7 Add test: scraper modules work without browser client (browser client is optional, no fallback attempted)

## 10. Validation

- [x] 10.1 Run `npm run build` and verify no TypeScript compilation errors
- [x] 10.2 Run `npm run test` and verify all existing and new tests pass
- [x] 10.3 Verify `src/clients/tiktok-browser.ts` does not import any Apify SDK modules
- [x] 10.4 Verify `src/clients/tiktok-web.ts` and `src/clients/tiktok-api.ts` do not import any Apify SDK modules
