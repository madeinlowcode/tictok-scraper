## MODIFIED Requirements

### Requirement: TikTok API Client for Layer 2 pagination
The `TikTokApiClient` SHALL call TikTok internal APIs with required base params (aid=1988, region=BR, device_platform=web_pc) and handle cursor-based pagination. It SHALL NOT import any Apify SDK modules. It SHALL use the signature generator to sign all API request URLs with msToken and X-Bogus tokens before sending. It SHALL use rotated cookies from the cookie manager's pool for each request. When a signed request returns 403 or the signature generator flags `requiresBrowserFallback`, the client SHALL include `requiresBrowserFallback: true` in the response object instead of throwing.

#### Scenario: Get profile videos with pagination
- **WHEN** `getProfileVideos(secUid, cursor)` is called
- **THEN** the client calls `/api/post/item_list/` with secUid, cursor, count=30, and API base params, with the URL signed by the signature generator

#### Scenario: Get comments with pagination
- **WHEN** `getComments(videoId, cursor)` is called
- **THEN** the client calls `/api/comment/list/` with aweme_id, cursor, count=50, with the URL signed by the signature generator

#### Scenario: Search by keyword
- **WHEN** `search(keyword, offset)` is called
- **THEN** the client calls `/api/search/general/full/` with keyword and offset, with the URL signed by the signature generator

#### Scenario: Get trending hashtags from Creative Center
- **WHEN** `getTrendingHashtags("BR", "7d")` is called
- **THEN** the client calls the Creative Center API at `ads.tiktok.com` with region and period filters

#### Scenario: Get popular sounds from Creative Center
- **WHEN** `getPopularSounds("BR")` is called
- **THEN** the client calls the Creative Center sound API with region filter

#### Scenario: API request uses rotated cookies
- **WHEN** the client makes consecutive API requests
- **THEN** each request uses the next cookie set from the cookie manager's rotation pool

#### Scenario: 403 response triggers fallback flag
- **WHEN** a signed API request returns HTTP 403
- **THEN** the client invalidates the current cookie set, and the response object includes `requiresBrowserFallback: true`

#### Scenario: Signature fallback flag propagated
- **WHEN** the signature generator returns `requiresBrowserFallback: true` during URL signing
- **THEN** the client still sends the request but includes `requiresBrowserFallback: true` in the response for the caller to handle

### Requirement: Clients accept proxy configuration
Both clients SHALL accept an optional `proxyUrl` parameter in their constructor for proxy configuration, without depending on Apify's ProxyConfiguration class.

#### Scenario: Client initialized with proxy
- **WHEN** a client is created with `{ proxyUrl: "http://proxy:8080" }`
- **THEN** all HTTP requests route through the specified proxy
