## Why

When TikTok deploys aggressive anti-bot measures (e.g., signature verification, CAPTCHA challenges, IP blocks), both Layer 1 (hydration extraction via HTTP) and Layer 2 (internal API calls) fail silently or return errors. Currently there is no fallback, meaning the scraper returns empty results or crashes. A headless browser fallback (Layer 3) is needed to handle these cases by rendering pages like a real user and intercepting XHR responses, ensuring data collection continues even under heavy anti-bot pressure.

## What Changes

- Add a new `TikTokBrowserClient` in `src/clients/tiktok-browser.ts` that uses PlaywrightCrawler to render TikTok pages and intercept XHR/fetch responses to capture API data from the browser context.
- Implement automatic fallback logic (Layer 1 → Layer 2 → Layer 3) so that when cheaper extraction layers fail, the browser client is invoked as a last resort.
- Integrate the fallback chain into all 7 scraper modules (video, profile, comment, hashtag, search, trending, sound).
- Extract cookies and tokens (e.g., `tt_webid`, `msToken`, `_signature`) from the browser context and feed them back to HTTP clients to improve subsequent Layer 1/Layer 2 success rates.
- Add mocked tests for fallback logic and browser client behavior.

## Capabilities

### New Capabilities
- `browser-fallback`: PlaywrightCrawler-based Layer 3 fallback with XHR interception, cookie/token extraction, and automatic escalation when Layers 1 and 2 fail

### Modified Capabilities
- `scraper-modules`: All 7 scrapers gain automatic Layer 3 fallback when Layers 1 and 2 fail
- `http-clients`: Clients can receive cookies and tokens extracted from the browser context to improve subsequent requests

## Impact

- **Code**: New file `src/clients/tiktok-browser.ts`; modifications to all 7 scrapers in `src/scrapers/`; modifications to `src/clients/tiktok-web.ts` and `src/clients/tiktok-api.ts` to accept injected tokens; updates to `src/main.ts` to initialize PlaywrightCrawler
- **Dependencies**: Playwright is already available through Crawlee (PlaywrightCrawler); no new npm dependencies required
- **Performance**: Layer 3 is significantly slower and more resource-intensive than Layers 1/2; it should only activate on failure, not as a primary extraction method
- **Testing**: New test files for browser client and fallback logic using mocked Playwright contexts
