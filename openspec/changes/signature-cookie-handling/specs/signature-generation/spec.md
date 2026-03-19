## ADDED Requirements

### Requirement: msToken extraction from TikTok cookies
The signature generator SHALL extract the msToken value from TikTok session cookies obtained via the cookie manager. It SHALL cache the extracted msToken and track its expiry (default 2 hours TTL). When the msToken is missing from cookies or expired, it SHALL trigger a cookie refresh and re-extract.

#### Scenario: Extract msToken from valid cookies
- **WHEN** `getMsToken()` is called and session cookies contain an `msToken` cookie
- **THEN** it returns the msToken value as a string

#### Scenario: msToken missing from cookies triggers refresh
- **WHEN** `getMsToken()` is called and session cookies do not contain an `msToken` cookie
- **THEN** it triggers a cookie refresh via the cookie manager and extracts msToken from the new cookies

#### Scenario: Cached msToken returned when not expired
- **WHEN** `getMsToken()` is called within the TTL window of a previously extracted msToken
- **THEN** it returns the cached value without making any HTTP requests

#### Scenario: Expired msToken triggers re-extraction
- **WHEN** `getMsToken()` is called after the msToken TTL has elapsed
- **THEN** it refreshes cookies and returns a newly extracted msToken

### Requirement: X-Bogus parameter generation
The signature generator SHALL compute the X-Bogus parameter for a given API URL and its query parameters. It SHALL use an extracted JavaScript function evaluated in an isolated context. If generation fails, it SHALL return `null` to signal that the caller should use a fallback strategy.

#### Scenario: Generate X-Bogus for a valid API URL
- **WHEN** `generateXBogus(url, params)` is called with a valid TikTok API URL and parameters
- **THEN** it returns a string containing the computed X-Bogus value

#### Scenario: X-Bogus generation fails gracefully
- **WHEN** the X-Bogus computation throws an error (e.g., stale algorithm)
- **THEN** `generateXBogus()` returns `null` instead of throwing

### Requirement: Sign a complete API request URL
The signature generator SHALL provide a `signUrl(baseUrl, params)` method that appends msToken and X-Bogus to the query parameters. If msToken extraction fails, it SHALL still attempt the request without msToken. If X-Bogus generation returns null, it SHALL set a `requiresBrowserFallback` flag on the result.

#### Scenario: Successfully sign a URL with all tokens
- **WHEN** `signUrl(baseUrl, params)` is called and both msToken and X-Bogus are available
- **THEN** it returns `{ signedUrl: "<url with msToken and X-Bogus>", requiresBrowserFallback: false }`

#### Scenario: Sign URL without X-Bogus triggers fallback flag
- **WHEN** `signUrl(baseUrl, params)` is called and X-Bogus generation returns null
- **THEN** it returns `{ signedUrl: "<url with msToken only>", requiresBrowserFallback: true }`

#### Scenario: Sign URL without msToken still proceeds
- **WHEN** `signUrl(baseUrl, params)` is called and msToken extraction fails
- **THEN** it returns a signed URL without msToken and sets `requiresBrowserFallback: false` (msToken absence alone does not require browser fallback)

### Requirement: Signature generator has no Apify SDK dependency
The signature generator module SHALL NOT import any modules from the Apify SDK. It SHALL receive dependencies (cookie manager) via constructor injection.

#### Scenario: Module imports are clean
- **WHEN** the `signature-generator.ts` file is analyzed for imports
- **THEN** no import statements reference `apify` or `@apify/*` packages
