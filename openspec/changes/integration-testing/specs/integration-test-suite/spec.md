## ADDED Requirements

### Requirement: HTML fixtures for hydration testing
The project SHALL include real TikTok HTML fixture files in `tests/fixtures/html/` covering profile, video, and hashtag page types. Each fixture MUST contain a valid `<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__">` tag with realistic JSON data matching the structure TikTok serves.

#### Scenario: Profile HTML fixture contains valid hydration data
- **WHEN** the profile HTML fixture file is read
- **THEN** it MUST contain a `<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__">` tag with JSON containing `__DEFAULT_SCOPE__["webapp.user-detail"].userInfo`

#### Scenario: Video HTML fixture contains valid hydration data
- **WHEN** the video HTML fixture file is read
- **THEN** it MUST contain a `<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__">` tag with JSON containing `__DEFAULT_SCOPE__["webapp.video-detail"].itemInfo.itemStruct`

#### Scenario: Hashtag HTML fixture contains valid hydration data
- **WHEN** the hashtag HTML fixture file is read
- **THEN** it MUST contain a `<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__">` tag with JSON containing `__DEFAULT_SCOPE__["webapp.hashtag-detail"]`

### Requirement: Hydration extractor integration tests
The hydration extractor SHALL be tested against full HTML fixture pages to validate it correctly extracts and parses the embedded JSON data structure.

#### Scenario: Extract hydration data from full profile HTML
- **WHEN** `extractHydrationData` is called with the full profile HTML fixture
- **THEN** it SHALL return an object containing the `webapp.user-detail` scope with `userInfo` data including `user` and `stats` sub-objects

#### Scenario: Extract hydration data from full video HTML
- **WHEN** `extractHydrationData` is called with the full video HTML fixture
- **THEN** it SHALL return an object containing the `webapp.video-detail` scope with `itemInfo.itemStruct` including `id`, `desc`, `author`, and `stats`

#### Scenario: Extract hydration data from full hashtag HTML
- **WHEN** `extractHydrationData` is called with the full hashtag HTML fixture
- **THEN** it SHALL return an object containing the `webapp.hashtag-detail` scope with challenge information

### Requirement: TikTokWebClient integration tests
The TikTokWebClient SHALL be tested with mocked HTTP responses returning real HTML fixtures to validate the full fetch-extract-parse pipeline produces correct output types.

#### Scenario: fetchProfile returns parsed profile data
- **WHEN** `TikTokWebClient.fetchProfile` is called with a username and got-scraping is mocked to return the profile HTML fixture
- **THEN** it SHALL return a `RawProfileData` object with valid `user` and `stats` fields

#### Scenario: fetchVideo returns parsed video data
- **WHEN** `TikTokWebClient.fetchVideo` is called with a video URL and got-scraping is mocked to return the video HTML fixture
- **THEN** it SHALL return a `RawVideoData` object with valid `id`, `desc`, `author`, and `stats` fields

#### Scenario: fetchHashtag returns parsed hashtag data
- **WHEN** `TikTokWebClient.fetchHashtag` is called with a hashtag name and got-scraping is mocked to return the hashtag HTML fixture
- **THEN** it SHALL return a `RawHashtagData` object with valid challenge data

### Requirement: TikTokApiClient integration tests
The TikTokApiClient SHALL be tested with mocked HTTP responses returning real API JSON fixtures to validate response parsing and field mapping.

#### Scenario: getProfileVideos returns parsed video list
- **WHEN** `TikTokApiClient.getProfileVideos` is called with a secUid and got-scraping is mocked to return the post item list JSON fixture
- **THEN** it SHALL return a `RawVideoListResponse` with `itemList` array, `hasMore` boolean, and `cursor` string

#### Scenario: getComments returns parsed comment list
- **WHEN** `TikTokApiClient.getComments` is called with a videoId and got-scraping is mocked to return the comment list JSON fixture
- **THEN** it SHALL return a `RawCommentListResponse` with `comments` array, `has_more` boolean, `cursor` number, and `total` number

#### Scenario: search returns parsed search results
- **WHEN** `TikTokApiClient.search` is called with a keyword and got-scraping is mocked to return the search JSON fixture
- **THEN** it SHALL return a `RawSearchResponse` with `data` array, `has_more` boolean, and `cursor` string

#### Scenario: getTrendingHashtags returns parsed trending data
- **WHEN** `TikTokApiClient.getTrendingHashtags` is called and got-scraping is mocked to return the creative center trending JSON fixture
- **THEN** it SHALL return a `RawTrendingResponse` with trending items

### Requirement: Parser integration tests with real data structures
All 7 parsers SHALL be tested against real TikTok data structures loaded from fixtures to validate they produce correctly shaped output without errors.

#### Scenario: Profile parser processes real hydration data
- **WHEN** the profile parser receives profile data extracted from the profile HTML fixture via the hydration extractor
- **THEN** it SHALL produce a parsed profile object with username, display name, follower count, and video count fields

#### Scenario: Video parser processes real hydration data
- **WHEN** the video parser receives video data extracted from the video HTML fixture via the hydration extractor
- **THEN** it SHALL produce a parsed video object with video ID, description, author info, and engagement stats

#### Scenario: Comment parser processes real API response data
- **WHEN** the comment parser receives comment data loaded from the API comment list fixture
- **THEN** it SHALL produce an array of parsed comments each with text, author, and like count

#### Scenario: Hashtag parser processes real hydration data
- **WHEN** the hashtag parser receives hashtag data extracted from the hashtag HTML fixture via the hydration extractor
- **THEN** it SHALL produce a parsed hashtag object with name and view count

#### Scenario: Search parser processes real API response data
- **WHEN** the search parser receives search data loaded from the API search fixture
- **THEN** it SHALL produce an array of parsed search results

#### Scenario: Sound parser processes real data structures
- **WHEN** the sound parser receives sound data from fixtures
- **THEN** it SHALL produce a parsed sound object with title and author info

#### Scenario: Trending data is parseable from Creative Center fixture
- **WHEN** trending data from the Creative Center trending fixture is processed
- **THEN** it SHALL produce structured trending items with names and counts

### Requirement: URL resolver integration tests
The URL resolver SHALL be tested with mocked HTTP redirects to validate short URL expansion works correctly.

#### Scenario: Resolve TikTok short URL to full URL
- **WHEN** the URL resolver receives a short URL (e.g., `https://vm.tiktok.com/ABC123/`) and HTTP is mocked to return a 301 redirect to the full video URL
- **THEN** it SHALL return the full resolved URL (e.g., `https://www.tiktok.com/@user/video/1234567890`)

#### Scenario: Full URL passes through without resolution
- **WHEN** the URL resolver receives a full TikTok URL that does not need resolution
- **THEN** it SHALL return the same URL unchanged

### Requirement: Integration test npm script
The project SHALL provide a `test:integration` npm script that runs only integration tests located in `tests/integration/`.

#### Scenario: Run integration tests separately
- **WHEN** `npm run test:integration` is executed
- **THEN** it SHALL run only test files matching `tests/integration/**/*.test.ts` and NOT run unit tests

#### Scenario: Default test command includes integration tests
- **WHEN** `npm run test` is executed
- **THEN** it SHALL run both unit tests and integration tests
