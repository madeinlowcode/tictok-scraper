## Why

The project has 38 passing unit tests covering parsers, extractors, processors, and utils in isolation, but zero integration tests that validate these components work together against real TikTok data structures. Without integration tests, regressions in hydration extraction, HTTP client parsing, or API response handling go undetected until production. Adding smoke-level integration tests now closes this gap before the scraper is published to the Apify Store.

## What Changes

- Capture real TikTok HTML fixtures (profile page, video page, hashtag page) for integration testing
- Create integration tests for the hydration extractor operating on full real HTML pages
- Create integration tests for TikTokWebClient with mocked HTTP but real response parsing pipelines
- Create integration tests for TikTokApiClient with mocked HTTP but real API response parsing
- Validate all 7 parsers against real TikTok data structures end-to-end
- Test URL resolver with mocked short URL resolution
- Add `test:integration` npm script to run integration tests separately from unit tests

## Capabilities

### New Capabilities

- `integration-test-suite`: Integration tests with real TikTok data fixtures that validate the hydration extractor, HTTP clients, API clients, all 7 parsers, and URL resolver work correctly against real data structures

### Modified Capabilities


## Impact

- **Tests**: New `tests/integration/` directory with integration test files
- **Fixtures**: New full-page HTML fixtures in `tests/fixtures/` alongside existing JSON fixtures
- **Package config**: New `test:integration` script in `package.json`; possible vitest config update for integration test separation
- **Dependencies**: No new runtime dependencies; may need vitest configuration for test filtering
- **Code**: No changes to production source code (`src/`)
