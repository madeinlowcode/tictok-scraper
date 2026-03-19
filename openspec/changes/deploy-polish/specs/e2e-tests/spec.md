## ADDED Requirements

### Requirement: E2E test for video URL input
The test suite SHALL include an end-to-end test that mocks the Apify Actor environment and verifies that a video URL input is routed to the video scraper, results are pushed via Actor.pushData, and Actor.charge is called with event name "video-scraped".

#### Scenario: Video URL flows through full pipeline
- **WHEN** the Actor receives input `{ "urls": ["https://www.tiktok.com/@user/video/123"] }`
- **THEN** Actor.pushData is called with video data and Actor.charge is called with `{ eventName: "video-scraped", count: 1 }`

### Requirement: E2E test for profile input
The test suite SHALL include an end-to-end test verifying that a profile URL or handle is routed to the profile scraper and correctly billed.

#### Scenario: Profile URL flows through full pipeline
- **WHEN** the Actor receives input `{ "urls": ["https://www.tiktok.com/@testuser"] }`
- **THEN** Actor.pushData is called with profile data and Actor.charge is called with `{ eventName: "profile-scraped", count: 1 }`

#### Scenario: Profile handle via profiles array
- **WHEN** the Actor receives input `{ "profiles": ["@testuser"] }`
- **THEN** Actor.pushData is called with profile data and Actor.charge is called with `{ eventName: "profile-scraped", count: 1 }`

### Requirement: E2E test for hashtag input
The test suite SHALL include an end-to-end test verifying that a hashtag URL or name is routed to the hashtag scraper and correctly billed.

#### Scenario: Hashtag URL flows through full pipeline
- **WHEN** the Actor receives input `{ "urls": ["https://www.tiktok.com/tag/dance"] }`
- **THEN** Actor.pushData is called with hashtag data and Actor.charge is called with `{ eventName: "hashtag-scraped", count: 1 }`

#### Scenario: Hashtag name via hashtags array
- **WHEN** the Actor receives input `{ "hashtags": ["dance"] }`
- **THEN** Actor.pushData is called with hashtag data and Actor.charge is called with `{ eventName: "hashtag-scraped", count: 1 }`

### Requirement: E2E test for search query input
The test suite SHALL include an end-to-end test verifying that a search query is routed to the search scraper and correctly billed per result count.

#### Scenario: Search query flows through full pipeline
- **WHEN** the Actor receives input `{ "searchQueries": ["viral dance"] }` and the search returns 10 results
- **THEN** Actor.pushData is called with 10 search results and Actor.charge is called with `{ eventName: "search-result", count: 10 }`

### Requirement: E2E test for trending input
The test suite SHALL include an end-to-end test verifying that `includeTrending: true` triggers the trending scraper and correctly bills per item count.

#### Scenario: Trending request flows through full pipeline
- **WHEN** the Actor receives input `{ "includeTrending": true, "region": "BR" }`
- **THEN** Actor.pushData is called with trending data and Actor.charge is called with `{ eventName: "trending-item", count: N }` where N is the number of trending items

### Requirement: E2E test for mixed input
The test suite SHALL include an end-to-end test verifying that multiple input types in a single run are all processed and billed correctly.

#### Scenario: Mixed input processes all types
- **WHEN** the Actor receives input with urls (video + profile), searchQueries, and includeTrending
- **THEN** Actor.pushData is called with all results and Actor.charge is called once per scrape type with correct event names

### Requirement: E2E test for invalid input
The test suite SHALL include end-to-end tests verifying that invalid inputs produce user-friendly error messages without crashing the Actor.

#### Scenario: Empty input produces helpful error
- **WHEN** the Actor receives null input
- **THEN** the Actor throws an error containing "No input provided"

#### Scenario: Invalid URL produces helpful error and continues
- **WHEN** the Actor receives input `{ "urls": ["https://youtube.com/watch?v=abc", "https://www.tiktok.com/@user/video/123"] }`
- **THEN** the invalid URL is skipped with a logged error, the valid URL is processed, and Actor.pushData is called with the valid result

#### Scenario: No actionable fields produces helpful error
- **WHEN** the Actor receives input `{ "region": "BR" }`
- **THEN** the Actor throws an error containing "No actionable input provided"
