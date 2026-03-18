## Why

TikTok's internal APIs (Layer 2) require dynamic security tokens (msToken, X-Bogus, _signature) to accept requests. Without these tokens, API calls return 403 responses or trigger captcha challenges, making the comment scraper, search scraper, and paginated profile/hashtag modules unreliable. The current cookie manager only caches a single set of cookies without rotation or persistence, further increasing the risk of blocked sessions.

## What Changes

- Add `signature-generator.ts` implementing msToken extraction from cookies/HTML and X-Bogus parameter computation for API request URLs
- Enhance `cookie-manager.ts` with cookie pool rotation (multiple cookie sets cycled across requests), cookie persistence across scraper restarts via key-value store, and automatic refresh on 403/captcha detection
- Integrate signature tokens into `TikTokApiClient.apiRequest()` so every Layer 2 call includes msToken, X-Bogus, and valid cookies
- Add a fallback mechanism: when signature generation fails or API returns 403 after signed requests, flag the request for Playwright-based extraction (Layer 3)
- Add unit tests for signature generation, cookie rotation, and integration with the API client

## Capabilities

### New Capabilities
- `signature-generation`: Dynamic token generation (msToken, X-Bogus) for TikTok API requests, including extraction from browser context as fallback

### Modified Capabilities
- `core-utils`: Enhanced cookie manager with cookie pool rotation across multiple sessions and persistence via key-value store
- `http-clients`: API client integrates signature tokens into every request and flags for Layer 3 fallback on signature failure

## Impact

- **Code**: New file `src/utils/signature-generator.ts`; modified `src/utils/cookie-manager.ts` and `src/clients/tiktok-api.ts`
- **Types**: New interfaces for signature tokens and cookie pool configuration in `src/types/index.ts`
- **Dependencies**: No new external dependencies; uses existing got-scraping and Playwright (already present for Layer 3)
- **APIs**: All Layer 2 API calls will now include signature parameters in query strings
- **Risk**: TikTok may change token algorithms; the fallback to Layer 3 mitigates this
