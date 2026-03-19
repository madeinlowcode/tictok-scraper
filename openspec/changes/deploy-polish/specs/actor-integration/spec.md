## MODIFIED Requirements

### Requirement: Actor entry point with input routing
`main.ts` SHALL use Apify SDK to initialize the Actor, read input, validate input (URL format, required fields, type checking), create proxy configuration, instantiate web/api clients, and route each input item to the correct scraper based on URL pattern detection. Invalid inputs SHALL be rejected with user-friendly error messages before scraping begins.

#### Scenario: Route video URL to video scraper
- **WHEN** input contains a URL with `/@user/video/123`
- **THEN** the Actor routes it to the video scraper

#### Scenario: Route profile URL to profile scraper
- **WHEN** input contains a URL with `/@username` (no /video/)
- **THEN** the Actor routes it to the profile scraper

#### Scenario: Route hashtag to hashtag scraper
- **WHEN** input contains a URL with `/tag/hashtag`
- **THEN** the Actor routes it to the hashtag scraper

#### Scenario: Route keyword to search scraper
- **WHEN** input contains a plain keyword string (not a URL)
- **THEN** the Actor routes it to the search scraper

#### Scenario: Route trending request
- **WHEN** input has `includeTrending: true`
- **THEN** the Actor calls the trending scraper

#### Scenario: Route short URL after resolution
- **WHEN** input contains a `vm.tiktok.com` URL
- **THEN** the Actor resolves it first, then routes based on the resolved URL

#### Scenario: Reject non-TikTok URL with user-friendly message
- **WHEN** input contains a non-TikTok URL like `https://youtube.com/watch?v=abc`
- **THEN** the Actor logs a user-friendly error and skips the URL without crashing

#### Scenario: Reject empty input with descriptive error
- **WHEN** input has no urls, profiles, hashtags, searchQueries, or includeTrending
- **THEN** the Actor fails with a message listing the required fields

#### Scenario: Classify and report rate limit errors
- **WHEN** a scraping request fails with HTTP 429
- **THEN** the Actor logs a user-friendly rate limit message instead of a raw stack trace

### Requirement: Graceful error handling
The Actor SHALL catch errors per-item (not fail the entire run), classify errors by type (RATE_LIMITED, GEO_BLOCKED, NOT_FOUND, NETWORK_ERROR), and log user-friendly error messages. It SHALL use `Actor.pushData` to store successful results even if some items fail.

#### Scenario: Partial failure handling
- **WHEN** 3 out of 5 URLs fail to scrape
- **THEN** the Actor pushes data for the 2 successful items and logs user-friendly errors for the 3 failures

#### Scenario: Rate limit errors show friendly message
- **WHEN** a URL fails with HTTP 429
- **THEN** the logged error says "Rate limited by TikTok" not a raw stack trace

#### Scenario: Not found errors show friendly message
- **WHEN** a URL fails with HTTP 404
- **THEN** the logged error says the content may have been deleted or set to private
