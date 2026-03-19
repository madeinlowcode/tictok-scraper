## ADDED Requirements

### Requirement: TikTok Browser Client renders pages via PlaywrightCrawler
The `TikTokBrowserClient` in `src/clients/tiktok-browser.ts` SHALL use PlaywrightCrawler to render TikTok pages in a headless browser. It SHALL intercept XHR/fetch responses matching TikTok API URL patterns and return the captured JSON data. It SHALL NOT import any Apify SDK modules.

#### Scenario: Fetch video page via browser
- **WHEN** `browserClient.fetchVideo(videoUrl)` is called
- **THEN** the browser navigates to the video URL, intercepts API responses matching `/api/` patterns, and returns the extracted video data as structured JSON

#### Scenario: Fetch profile page via browser
- **WHEN** `browserClient.fetchProfile(username)` is called
- **THEN** the browser navigates to `https://www.tiktok.com/@username`, waits for hydration data or API responses, and returns profile data

#### Scenario: Fetch hashtag page via browser
- **WHEN** `browserClient.fetchHashtag(hashtag)` is called
- **THEN** the browser navigates to `https://www.tiktok.com/tag/hashtag` and returns extracted hashtag data

#### Scenario: Fetch sound page via browser
- **WHEN** `browserClient.fetchSound(musicUrl)` is called
- **THEN** the browser navigates to the music URL and returns extracted sound data

### Requirement: Browser Client intercepts XHR responses
The `TikTokBrowserClient` SHALL register a response interceptor on the Playwright page that captures responses from URLs matching TikTok API patterns (e.g., `/api/post/item_list/`, `/api/comment/list/`, `/api/search/`). Captured responses SHALL be parsed as JSON and made available to the caller.

#### Scenario: Intercept video list API response
- **WHEN** the browser renders a profile page that triggers `/api/post/item_list/`
- **THEN** the intercepted response body is parsed as JSON and returned alongside hydration data

#### Scenario: Ignore non-API responses
- **WHEN** the browser loads CSS, images, or tracking pixel requests
- **THEN** those responses are NOT captured or returned

### Requirement: Browser Client extracts cookies and tokens
The `TikTokBrowserClient` SHALL extract authentication cookies and tokens (`tt_webid`, `msToken`, `tt_chain_token`, `ttwid`) from the browser context after page load. These SHALL be returned in a `TokenStore` object.

#### Scenario: Extract tokens after successful page load
- **WHEN** the browser successfully loads a TikTok page
- **THEN** `browserClient.getTokenStore()` returns a `TokenStore` containing cookies and tokens with their extraction timestamp

#### Scenario: Token extraction with missing cookies
- **WHEN** the browser loads a page but some expected cookies are not set
- **THEN** the `TokenStore` contains only the cookies that were present, with missing ones as `undefined`

### Requirement: Browser Client uses lazy initialization
The `TikTokBrowserClient` SHALL NOT launch a browser until the first extraction method is called. The browser instance SHALL be reused across multiple calls within the same run and closed when `dispose()` is called.

#### Scenario: Browser not launched until needed
- **WHEN** `TikTokBrowserClient` is constructed
- **THEN** no browser process is spawned until `fetchVideo`, `fetchProfile`, `fetchHashtag`, or `fetchSound` is called

#### Scenario: Browser reused across calls
- **WHEN** `fetchVideo` is called twice in sequence
- **THEN** the same browser instance is reused for both calls

#### Scenario: Browser disposed after use
- **WHEN** `browserClient.dispose()` is called
- **THEN** the browser process is terminated and resources are freed

### Requirement: Fallback orchestration via withFallback utility
A `withFallback<T>(layers: Array<() => Promise<T>>)` utility function SHALL execute layers in order, catching errors from each layer and proceeding to the next. It SHALL return the result from the first successful layer. If all layers fail, it SHALL throw an aggregate error containing all individual layer errors.

#### Scenario: First layer succeeds
- **WHEN** `withFallback([layer1, layer2, layer3])` is called and `layer1` resolves successfully
- **THEN** the result from `layer1` is returned and `layer2`/`layer3` are never called

#### Scenario: First layer fails, second succeeds
- **WHEN** `layer1` throws an error and `layer2` resolves successfully
- **THEN** the result from `layer2` is returned and `layer3` is never called

#### Scenario: All layers fail
- **WHEN** all three layers throw errors
- **THEN** an aggregate error is thrown containing the errors from all three layers

### Requirement: Browser Client accepts proxy configuration
The `TikTokBrowserClient` SHALL accept an optional `proxyUrl` parameter and configure the browser context to route traffic through the specified proxy.

#### Scenario: Browser with proxy
- **WHEN** `TikTokBrowserClient` is created with `{ proxyUrl: "http://proxy:8080" }`
- **THEN** all browser requests are routed through the specified proxy
