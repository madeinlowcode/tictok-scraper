## ADDED Requirements

### Requirement: URL format validation
The Actor SHALL validate that all URLs in the `urls` input array are valid TikTok URLs (domain must be `tiktok.com`, `www.tiktok.com`, `vm.tiktok.com`, or `m.tiktok.com`). Invalid URLs SHALL be rejected with a user-friendly error message before any scraping begins.

#### Scenario: Valid TikTok URL accepted
- **WHEN** input contains `urls: ["https://www.tiktok.com/@user/video/123"]`
- **THEN** the URL passes validation and is processed normally

#### Scenario: Non-TikTok URL rejected
- **WHEN** input contains `urls: ["https://youtube.com/watch?v=abc"]`
- **THEN** the Actor logs an error: "Invalid URL: https://youtube.com/watch?v=abc - Only TikTok URLs are supported (tiktok.com)" and skips this URL

#### Scenario: Malformed URL rejected
- **WHEN** input contains `urls: ["not-a-url"]`
- **THEN** the Actor logs an error: "Invalid URL: not-a-url - Please provide a valid URL starting with http:// or https://"

### Requirement: Required fields validation
The Actor SHALL validate that at least one actionable input is provided: `urls`, `profiles`, `hashtags`, `searchQueries`, or `includeTrending`. If none are provided, the Actor SHALL fail immediately with a descriptive error message.

#### Scenario: No actionable input provided
- **WHEN** input is `{ "region": "BR" }` with no urls, profiles, hashtags, searchQueries, or includeTrending
- **THEN** the Actor fails with error: "No actionable input provided. Please specify at least one of: urls, profiles, hashtags, searchQueries, or set includeTrending to true."

#### Scenario: Valid minimal input accepted
- **WHEN** input is `{ "urls": ["https://www.tiktok.com/@user"] }`
- **THEN** the input passes validation

### Requirement: Type checking for input fields
The Actor SHALL validate that input fields have correct types: `urls`, `profiles`, `hashtags`, and `searchQueries` SHALL be arrays of strings; `maxResults`, `maxComments`, and `maxVideos` SHALL be positive integers; `region` SHALL be a string; `includeTrending`, `includeComments`, and `includeEngagement` SHALL be booleans.

#### Scenario: Non-array urls field rejected
- **WHEN** input contains `urls: "https://www.tiktok.com/@user"` (string instead of array)
- **THEN** the Actor fails with error: "Invalid input: 'urls' must be an array of strings."

#### Scenario: Negative maxResults rejected
- **WHEN** input contains `maxResults: -5`
- **THEN** the Actor fails with error: "Invalid input: 'maxResults' must be a positive integer."

### Requirement: User-friendly error messages for common failures
The Actor SHALL classify errors into categories and provide user-friendly messages: RATE_LIMITED (HTTP 429) SHALL suggest waiting and retrying; GEO_BLOCKED (HTTP 403 with geo indicators) SHALL suggest using a different region; NOT_FOUND (HTTP 404) SHALL indicate the content may be deleted or private; NETWORK_ERROR SHALL suggest checking proxy configuration.

#### Scenario: Rate limit error message
- **WHEN** a scraping request returns HTTP 429
- **THEN** the Actor logs: "Rate limited by TikTok. The Actor will retry automatically with exponential backoff."

#### Scenario: Content not found error message
- **WHEN** a scraping request returns HTTP 404
- **THEN** the Actor logs: "Content not found: [URL]. The video/profile may have been deleted or set to private."

#### Scenario: Geo-blocked error message
- **WHEN** a scraping request returns HTTP 403 with geo-restriction indicators
- **THEN** the Actor logs: "Content appears to be geo-restricted. Try setting a different region in the input."

#### Scenario: Network error message
- **WHEN** a scraping request fails with a connection error
- **THEN** the Actor logs: "Network error while scraping [URL]. Please check proxy configuration."
