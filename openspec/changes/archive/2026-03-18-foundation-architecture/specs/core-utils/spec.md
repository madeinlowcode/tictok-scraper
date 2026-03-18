## ADDED Requirements

### Requirement: Retry handler with exponential backoff
The retry handler SHALL wrap async functions with configurable max retries and exponential backoff delay. It SHALL retry on transient errors (5xx, timeouts, network errors) and NOT retry on 4xx errors (except 429 rate limit).

#### Scenario: Successful retry after transient failure
- **WHEN** a function fails twice with 503 then succeeds
- **THEN** the retry handler returns the successful result after 2 retries

#### Scenario: Retry on rate limit (429)
- **WHEN** a function fails with 429 status
- **THEN** the retry handler waits with backoff and retries

#### Scenario: No retry on 404
- **WHEN** a function fails with 404 status
- **THEN** the retry handler throws immediately without retrying

### Requirement: Rate limiter controls request frequency
The rate limiter SHALL enforce a configurable maximum requests per time window to avoid triggering TikTok anti-bot defenses.

#### Scenario: Rate limiting applied
- **WHEN** requests exceed the configured rate
- **THEN** subsequent requests are delayed until the window resets

### Requirement: URL resolver handles all TikTok URL formats
The URL resolver SHALL provide: `extractVideoId(url)`, `extractUsername(url)`, `resolveShortUrl(url)` (follows redirects from vm.tiktok.com), and `detectInputType(input)` returning 'profile' | 'video' | 'hashtag' | 'sound' | 'keyword'.

#### Scenario: Extract video ID from full URL
- **WHEN** `extractVideoId("https://www.tiktok.com/@user/video/7312345678901234567")` is called
- **THEN** it returns `"7312345678901234567"`

#### Scenario: Extract username from profile URL
- **WHEN** `extractUsername("https://www.tiktok.com/@johndoe?lang=en")` is called
- **THEN** it returns `"johndoe"`

#### Scenario: Resolve short URL
- **WHEN** `resolveShortUrl("https://vm.tiktok.com/ZMabc123/")` is called
- **THEN** it follows redirects and returns the full canonical URL

#### Scenario: Detect input type
- **WHEN** `detectInputType("https://www.tiktok.com/@user/video/123")` is called
- **THEN** it returns `"video"`

### Requirement: Cookie manager maintains session cookies
The cookie manager SHALL obtain initial cookies by visiting TikTok homepage, store them for reuse across requests, and refresh when expired.

#### Scenario: Get session cookies
- **WHEN** `getSessionCookies()` is called for the first time
- **THEN** it makes a GET to tiktok.com and captures the Set-Cookie headers

#### Scenario: Reuse existing cookies
- **WHEN** `getSessionCookies()` is called again within session
- **THEN** it returns cached cookies without making a new request
