## MODIFIED Requirements

### Requirement: Video Scraper extracts video metadata via Layer 1
The `scrapeVideo` function SHALL accept a web client, an optional browser client, and a video identifier (URL or videoId), resolve short URLs if needed, fetch the video page via Layer 1, and return a `VideoOutput`. If Layer 1 fails and a browser client is provided, it SHALL automatically fall back to Layer 3 (browser extraction).

#### Scenario: Scrape video by URL
- **WHEN** `scrapeVideo(webClient, "https://www.tiktok.com/@user/video/123")` is called
- **THEN** it fetches the page, extracts hydration data, parses it, and returns a complete `VideoOutput`

#### Scenario: Scrape video with short URL
- **WHEN** `scrapeVideo(webClient, "https://vm.tiktok.com/ZMabc123/")` is called
- **THEN** it resolves the short URL first, then scrapes normally

#### Scenario: Scrape video with Layer 1 failure and browser fallback
- **WHEN** `scrapeVideo(webClient, videoUrl, { browserClient })` is called and Layer 1 fails
- **THEN** it falls back to the browser client to render the page and extract video data via Layer 3

### Requirement: Profile Scraper extracts profile data with optional video pagination
The `scrapeProfile` function SHALL fetch profile data via Layer 1, then optionally paginate additional videos via Layer 2 (API client) up to `maxVideos`. It SHALL optionally calculate engagement metrics. If Layer 1 and Layer 2 fail and a browser client is provided, it SHALL fall back to Layer 3.

#### Scenario: Scrape profile with basic data only
- **WHEN** `scrapeProfile(webClient, apiClient, "@username", { maxVideos: 0 })` is called
- **THEN** it returns `ProfileOutput` with profile info but no extra videos beyond hydration data

#### Scenario: Scrape profile with video pagination
- **WHEN** `scrapeProfile(webClient, apiClient, "@username", { maxVideos: 60 })` is called
- **THEN** it fetches initial videos from hydration, then paginates via `/api/post/item_list/` until 60 videos or no more data

#### Scenario: Scrape profile with engagement metrics
- **WHEN** `scrapeProfile` is called with `{ includeEngagement: true }`
- **THEN** the returned `ProfileOutput` includes calculated engagement metrics

#### Scenario: Scrape profile with Layer 1 and Layer 2 failure and browser fallback
- **WHEN** `scrapeProfile(webClient, apiClient, "@username", { browserClient })` is called and both Layer 1 and Layer 2 fail
- **THEN** it falls back to the browser client, using XHR interception to capture profile data and video lists

### Requirement: Comment Scraper extracts comments via Layer 2
The `scrapeComments` function SHALL use the API client to fetch comments via `/api/comment/list/` with cursor-based pagination up to `maxComments`. If Layer 2 fails and a browser client is provided, it SHALL fall back to Layer 3.

#### Scenario: Scrape comments with pagination
- **WHEN** `scrapeComments(apiClient, "videoId", { maxComments: 100 })` is called
- **THEN** it paginates via cursor until 100 comments are collected or hasMore is false

#### Scenario: Scrape comments with Layer 2 failure and browser fallback
- **WHEN** `scrapeComments(apiClient, "videoId", { maxComments: 100, browserClient })` is called and Layer 2 fails
- **THEN** it falls back to the browser client, navigating to the video page and intercepting comment API responses

### Requirement: Hashtag Scraper extracts hashtag data and videos
The `scrapeHashtag` function SHALL fetch initial hashtag data via Layer 1, then optionally paginate more videos via Layer 2. If both layers fail and a browser client is provided, it SHALL fall back to Layer 3.

#### Scenario: Scrape hashtag with videos
- **WHEN** `scrapeHashtag(webClient, apiClient, "dance", { maxVideos: 30 })` is called
- **THEN** it returns `HashtagOutput` with metadata and up to 30 videos

#### Scenario: Scrape hashtag with Layer 1 and Layer 2 failure and browser fallback
- **WHEN** `scrapeHashtag(webClient, apiClient, "dance", { maxVideos: 30, browserClient })` is called and both layers fail
- **THEN** it falls back to the browser client to render the hashtag page and intercept video list responses

### Requirement: Search Scraper searches by keyword via Layer 2
The `scrapeSearch` function SHALL use the API client to search via `/api/search/general/full/` with offset-based pagination. If Layer 2 fails and a browser client is provided, it SHALL fall back to Layer 3.

#### Scenario: Search with filters
- **WHEN** `scrapeSearch(apiClient, "cooking", { maxResults: 50, sortBy: "likes" })` is called
- **THEN** it paginates search results up to 50 items

#### Scenario: Search with Layer 2 failure and browser fallback
- **WHEN** `scrapeSearch(apiClient, "cooking", { maxResults: 50, browserClient })` is called and Layer 2 fails
- **THEN** it falls back to the browser client, navigating to TikTok search and intercepting search API responses

### Requirement: Trending Scraper fetches trending data from Creative Center
The `scrapeTrending` function SHALL use the API client to fetch trending hashtags from the Creative Center API, defaulting to region BR. If the API fails and a browser client is provided, it SHALL fall back to Layer 3.

#### Scenario: Scrape trending for Brazil
- **WHEN** `scrapeTrending(apiClient, { region: "BR", period: "7d" })` is called
- **THEN** it returns `TrendingOutput` with ranked items including rank, rankChange, viewCount, trendChart

#### Scenario: Scrape trending with API failure and browser fallback
- **WHEN** `scrapeTrending(apiClient, { region: "BR", period: "7d", browserClient })` is called and the Creative Center API fails
- **THEN** it falls back to the browser client, navigating to the Creative Center page and intercepting trending data responses

### Requirement: Sound Scraper extracts sound metadata and videos
The `scrapeSound` function SHALL fetch sound data via Layer 1 (URL) or Creative Center API (popular sounds), and optionally include videos using the sound. If both layers fail and a browser client is provided, it SHALL fall back to Layer 3.

#### Scenario: Scrape sound by URL
- **WHEN** `scrapeSound(webClient, apiClient, "https://www.tiktok.com/music/song-123")` is called
- **THEN** it returns `SoundOutput` with music metadata

#### Scenario: Scrape sound with Layer 1 and API failure and browser fallback
- **WHEN** `scrapeSound(webClient, apiClient, musicUrl, { browserClient })` is called and both Layer 1 and Creative Center API fail
- **THEN** it falls back to the browser client to render the sound page and extract metadata
