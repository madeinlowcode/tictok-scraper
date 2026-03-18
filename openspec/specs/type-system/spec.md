## ADDED Requirements

### Requirement: Output interfaces for all 7 modules
The type system SHALL define TypeScript interfaces for all output types: `ProfileOutput`, `VideoOutput`, `CommentOutput`, `HashtagOutput`, `TrendingOutput`, `SoundOutput`. All interfaces SHALL include a `scrapedAt: string` field with ISO 8601 timestamp.

#### Scenario: VideoOutput has complete fields
- **WHEN** a video is scraped successfully
- **THEN** the result conforms to `VideoOutput` with videoId, url, description, createTime, createTimeISO, duration, coverUrl, stats (playCount, likeCount, commentCount, shareCount, collectCount), hashtags, author, music, isAd, and scrapedAt

#### Scenario: ProfileOutput includes engagement metrics
- **WHEN** a profile is scraped with engagement calculation
- **THEN** the result conforms to `ProfileOutput` with engagement object containing avgViews, avgLikes, avgComments, avgShares, engagementRate

### Requirement: Raw data types for internal use
The type system SHALL define raw data types (`RawProfileData`, `RawVideoData`, `RawHashtagData`, `RawCommentData`, `RawSearchResponse`, `RawSoundData`, `RawTrendingResponse`, `RawVideoListResponse`, `RawCommentListResponse`) to represent data before parsing.

#### Scenario: Raw types are used by clients and parsers
- **WHEN** a client returns data
- **THEN** the return type is a Raw* type, not an Output type

### Requirement: ScraperInput type for Actor input validation
The type system SHALL define a `ScraperInput` interface covering all Actor input fields: urls, searchQueries, hashtags, profiles, maxResults, maxComments, maxVideos, region, includeTrending, includeEngagement, includeComments.

#### Scenario: Input with multiple URLs
- **WHEN** the Actor receives input with urls array
- **THEN** the input conforms to `ScraperInput` type

### Requirement: EngagementMetrics type
The type system SHALL define `EngagementMetrics` with: avgViews, avgLikes, avgComments, avgShares, engagementRate, likeToViewRatio, commentToViewRatio, shareToViewRatio, estimatedReach.

#### Scenario: Engagement calculator returns correct type
- **WHEN** engagement is calculated from profile and videos
- **THEN** the result conforms to `EngagementMetrics`

### Requirement: Custom error types
The type system SHALL define error classes: `TikTokError` (base), `ProfileNotFoundError`, `VideoNotFoundError`, `RateLimitError`, `HydrationExtractionError`. All SHALL extend `TikTokError` which extends `Error`.

#### Scenario: Error hierarchy
- **WHEN** a `ProfileNotFoundError` is thrown
- **THEN** it is an instance of both `TikTokError` and `Error`
