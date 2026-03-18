## ADDED Requirements

### Requirement: Actor entry point with input routing
`main.ts` SHALL use Apify SDK to initialize the Actor, read input, create proxy configuration, instantiate web/api clients, and route each input item to the correct scraper based on URL pattern detection.

#### Scenario: Route video URL to video scraper
- **WHEN** input contains a URL with `/@user/video/123`
- **THEN** the Actor routes it to the video scraper

#### Scenario: Route profile URL to profile scraper
- **WHEN** input contains a URL with `/@username` (no /video/)
- **THEN** the Actor routes it to the profile scraper

#### Scenario: Route hashtag to hashtag scraper
- **WHEN** input contains a URL with `/tag/hashtag`
- **THEN** the Actor routes it to the hashtag scraper

#### Scenario: Route keyword to search scraper
- **WHEN** input contains a plain keyword string (not a URL)
- **THEN** the Actor routes it to the search scraper

#### Scenario: Route trending request
- **WHEN** input has `includeTrending: true`
- **THEN** the Actor calls the trending scraper

#### Scenario: Route short URL after resolution
- **WHEN** input contains a `vm.tiktok.com` URL
- **THEN** the Actor resolves it first, then routes based on the resolved URL

### Requirement: Pay per Event billing
The Actor SHALL call `Actor.charge()` with appropriate event names and counts after successfully scraping items. Event names: `profile-scraped`, `video-scraped`, `comment-scraped`, `search-result`, `trending-item`, `hashtag-scraped`, `sound-scraped`.

#### Scenario: Charge after scraping videos
- **WHEN** 10 videos are successfully scraped
- **THEN** `Actor.charge({ eventName: "video-scraped", count: 10 })` is called

### Requirement: Apify Actor configuration files
The project SHALL include `.actor/actor.json` with Actor metadata and `.actor/input_schema.json` with a complete JSON Schema for all input fields. A `Dockerfile` SHALL be provided for Actor deployment.

#### Scenario: Valid input schema
- **WHEN** the input schema is loaded by Apify
- **THEN** it defines fields for urls, searchQueries, hashtags, profiles, maxResults, maxComments, maxVideos, region, includeTrending, includeEngagement, includeComments

### Requirement: Graceful error handling
The Actor SHALL catch errors per-item (not fail the entire run) and log descriptive error messages. It SHALL use `Actor.pushData` to store successful results even if some items fail.

#### Scenario: Partial failure handling
- **WHEN** 3 out of 5 URLs fail to scrape
- **THEN** the Actor pushes data for the 2 successful items and logs errors for the 3 failures
