## 1. Input Validation

- [ ] 1.1 Add `validateInput()` function in `src/main.ts` that checks for at least one actionable input (`urls`, `profiles`, `hashtags`, `searchQueries`, or `includeTrending`) and fails with descriptive error if none provided
- [ ] 1.2 Add URL format validation in `validateInput()`: verify each URL in `urls` array has a valid `tiktok.com`, `www.tiktok.com`, `vm.tiktok.com`, or `m.tiktok.com` domain; log user-friendly error and skip invalid URLs
- [ ] 1.3 Add malformed URL detection: reject entries that don't start with `http://` or `https://` with clear error message
- [ ] 1.4 Add type checking for input fields: `urls`, `profiles`, `hashtags`, `searchQueries` must be arrays of strings; `maxResults`, `maxComments`, `maxVideos` must be positive integers; `region` must be string; `includeTrending`, `includeComments`, `includeEngagement` must be booleans
- [ ] 1.5 Add null/empty input check that fails with "No input provided" error message

## 2. User-Friendly Error Handling

- [ ] 2.1 Define error classification categories in `src/main.ts`: `INVALID_INPUT`, `RATE_LIMITED`, `GEO_BLOCKED`, `NOT_FOUND`, `NETWORK_ERROR`, `UNKNOWN`
- [ ] 2.2 Add error classification logic that detects HTTP 429 (rate limited), HTTP 403 with geo indicators (geo-blocked), HTTP 404 (not found), and connection errors (network error)
- [ ] 2.3 Add user-friendly error message mapping: rate limit → "Rate limited by TikTok. The Actor will retry automatically with exponential backoff."; not found → "Content not found: [URL]. The video/profile may have been deleted or set to private."; geo-blocked → "Content appears to be geo-restricted. Try setting a different region in the input."; network → "Network error while scraping [URL]. Please check proxy configuration."
- [ ] 2.4 Update catch blocks in `main.ts` to use error classification and log user-friendly messages instead of raw stack traces
- [ ] 2.5 Implement per-item error handling so that failed items do not crash the entire run; push successful results via `Actor.pushData` even when some items fail

## 3. Deployment Configuration

- [ ] 3.1 Convert Dockerfile to multi-stage build: build stage compiles TypeScript using `npm run build`, runtime stage uses `apify/actor-node:20` base image and copies only compiled JavaScript and production `node_modules`
- [ ] 3.2 Verify runtime Docker image does not contain TypeScript source files or devDependencies
- [ ] 3.3 Update `.actor/actor.json` with SEO-optimized title (under 70 chars, includes "TikTok"), detailed description (150-300 chars mentioning profiles, videos, comments, hashtags, trending, Brazil, engagement metrics), and relevant `categories` array
- [ ] 3.4 Verify PPE pricing configuration matches PRD: profile-scraped $0.003, video-scraped $0.002, comment-scraped $0.0003, search-result $0.001, trending-item $0.002, hashtag-scraped $0.003, sound-scraped $0.002, free tier 50 items

## 4. Documentation

- [ ] 4.1 Create `README.md` with project description and features list covering all 7 modules
- [ ] 4.2 Add input/output JSON examples for each module in README (profile, video, comment, hashtag, search, trending, sound)
- [ ] 4.3 Add PPE pricing table to README with per-event costs and free tier info
- [ ] 4.4 Add FAQ section to README addressing common questions
- [ ] 4.5 Add competitor comparison table (vs Clockworks TikTok Scraper) to README
- [ ] 4.6 Create `CHANGELOG.md` in Keep a Changelog format with version 1.0.0 entry documenting the MVP release and all 7 modules

## 5. End-to-End Tests

- [ ] 5.1 Set up E2E test infrastructure in `tests/e2e/` using Vitest with `vi.mock` for Apify SDK (`Actor.getInput`, `Actor.pushData`, `Actor.charge`) and mocked scraper functions returning fixture data
- [ ] 5.2 Add E2E test: video URL input is routed to video scraper, `Actor.pushData` called with video data, `Actor.charge` called with `{ eventName: "video-scraped", count: 1 }`
- [ ] 5.3 Add E2E test: profile URL input (`/@testuser`) is routed to profile scraper and billed as `profile-scraped`
- [ ] 5.4 Add E2E test: profile handle via `profiles` array is routed to profile scraper and billed as `profile-scraped`
- [ ] 5.5 Add E2E test: hashtag URL (`/tag/dance`) is routed to hashtag scraper and billed as `hashtag-scraped`
- [ ] 5.6 Add E2E test: hashtag name via `hashtags` array is routed to hashtag scraper and billed as `hashtag-scraped`
- [ ] 5.7 Add E2E test: search query via `searchQueries` array is routed to search scraper, `Actor.charge` called with `{ eventName: "search-result", count: N }` matching result count
- [ ] 5.8 Add E2E test: `includeTrending: true` with `region: "BR"` triggers trending scraper and bills per item as `trending-item`
- [ ] 5.9 Add E2E test: mixed input (video URL + profile URL + searchQueries + includeTrending) processes all types and calls `Actor.charge` once per scrape type with correct event names
- [ ] 5.10 Add E2E test: null input produces error containing "No input provided"
- [ ] 5.11 Add E2E test: invalid URL (youtube.com) is skipped with logged error while valid TikTok URL in same input is processed successfully
- [ ] 5.12 Add E2E test: input with no actionable fields (`{ "region": "BR" }`) produces error containing "No actionable input provided"
