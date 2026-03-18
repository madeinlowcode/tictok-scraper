## ADDED Requirements

### Requirement: Vitest configuration with TypeScript support
The project SHALL have a Vitest configuration that supports TypeScript tests directly without pre-compilation. Tests SHALL be located in `tests/unit/` mirroring the `src/` structure.

#### Scenario: Run all tests
- **WHEN** `npm run test` is executed
- **THEN** Vitest discovers and runs all `*.test.ts` files in `tests/`

### Requirement: Test fixtures with real TikTok data
The project SHALL include JSON fixture files in `tests/fixtures/` representing real TikTok responses: `hydration-profile.json`, `hydration-video.json`, `hydration-hashtag.json`, `api-post-item-list.json`, `api-comment-list.json`, `api-search.json`, `creative-center-trending.json`.

#### Scenario: Fixtures are valid JSON
- **WHEN** a test loads a fixture file
- **THEN** it parses as valid JSON matching the expected TikTok data structure

### Requirement: Unit tests for parsers, extractors, and processors
The test suite SHALL include unit tests for: hydration extractor (extract from valid HTML, handle missing script, handle malformed JSON), video parser, profile parser, comment parser, engagement calculator (normal case, zero views, empty videos), and URL resolver.

#### Scenario: Parser tests use fixtures
- **WHEN** parser unit tests run
- **THEN** they use fixture data as input and assert correct output structure

#### Scenario: Extractor tests cover error cases
- **WHEN** hydration extractor tests run
- **THEN** they cover: valid HTML, missing script tag, malformed JSON
