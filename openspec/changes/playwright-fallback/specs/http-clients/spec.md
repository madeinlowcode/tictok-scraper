## MODIFIED Requirements

### Requirement: TikTok Web Client for Layer 1 data extraction
The `TikTokWebClient` SHALL fetch TikTok HTML pages using got-scraping with proper headers (Accept-Language: pt-BR, realistic User-Agent, sec-ch-ua headers) and pass them through the hydration extractor. It SHALL NOT import any Apify SDK modules. It SHALL optionally accept a `TokenStore` and include its cookies and tokens in HTTP request headers to improve success rates.

#### Scenario: Fetch profile page
- **WHEN** `fetchProfile("username")` is called
- **THEN** the client makes a GET request to `https://www.tiktok.com/@username` with proper headers and returns extracted profile data

#### Scenario: Fetch video page
- **WHEN** `fetchVideo(videoUrl)` is called
- **THEN** the client fetches the URL, extracts hydration data, and returns raw video data

#### Scenario: Fetch hashtag page
- **WHEN** `fetchHashtag("trending")` is called
- **THEN** the client fetches `https://www.tiktok.com/tag/trending` and returns extracted hashtag data

#### Scenario: Fetch sound page
- **WHEN** `fetchSound(musicUrl)` is called
- **THEN** the client fetches the music URL and returns extracted sound data

#### Scenario: HTTP request with retry on failure
- **WHEN** a fetch request fails with a transient error (5xx, timeout)
- **THEN** the client retries with exponential backoff up to the configured max retries

#### Scenario: Fetch with injected tokens from TokenStore
- **WHEN** `fetchProfile("username")` is called and a `TokenStore` with valid cookies is available
- **THEN** the client includes `tt_webid`, `msToken`, and other tokens as Cookie headers in the request

### Requirement: TikTok API Client for Layer 2 pagination
The `TikTokApiClient` SHALL call TikTok internal APIs with required base params (aid=1988, region=BR, device_platform=web_pc) and handle cursor-based pagination. It SHALL NOT import any Apify SDK modules. It SHALL optionally accept a `TokenStore` and include its tokens in API request parameters and headers.

#### Scenario: Get profile videos with pagination
- **WHEN** `getProfileVideos(secUid, cursor)` is called
- **THEN** the client calls `/api/post/item_list/` with secUid, cursor, count=30, and API base params

#### Scenario: Get comments with pagination
- **WHEN** `getComments(videoId, cursor)` is called
- **THEN** the client calls `/api/comment/list/` with aweme_id, cursor, count=50

#### Scenario: Search by keyword
- **WHEN** `search(keyword, offset)` is called
- **THEN** the client calls `/api/search/general/full/` with keyword and offset

#### Scenario: Get trending hashtags from Creative Center
- **WHEN** `getTrendingHashtags("BR", "7d")` is called
- **THEN** the client calls the Creative Center API at `ads.tiktok.com` with region and period filters

#### Scenario: Get popular sounds from Creative Center
- **WHEN** `getPopularSounds("BR")` is called
- **THEN** the client calls the Creative Center sound API with region filter

#### Scenario: API request with injected tokens from TokenStore
- **WHEN** `getProfileVideos(secUid, cursor)` is called and a `TokenStore` with valid `msToken` is available
- **THEN** the client includes `msToken` in the API request parameters

### Requirement: Clients accept proxy configuration
Both clients SHALL accept an optional `proxyUrl` parameter in their constructor for proxy configuration, without depending on Apify's ProxyConfiguration class.

#### Scenario: Client initialized with proxy
- **WHEN** a client is created with `{ proxyUrl: "http://proxy:8080" }`
- **THEN** all HTTP requests route through the specified proxy

### Requirement: Clients accept a TokenStore for token injection
Both `TikTokWebClient` and `TikTokApiClient` SHALL accept an optional `TokenStore` via a `setTokenStore(store: TokenStore)` method or constructor parameter. When a `TokenStore` is set, the clients SHALL include its tokens in subsequent requests. The `TokenStore` interface SHALL contain cookies, tokens, and an extraction timestamp.

#### Scenario: Set TokenStore after browser fallback
- **WHEN** `webClient.setTokenStore(tokenStore)` is called with tokens extracted from the browser client
- **THEN** subsequent HTTP requests from the web client include those tokens

#### Scenario: TokenStore with expired tokens
- **WHEN** a `TokenStore` has an extraction timestamp older than 30 minutes
- **THEN** the client treats the tokens as stale and does not include them in requests
