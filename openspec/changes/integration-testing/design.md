## Context

The TikTok Scraper Pro project has a working foundation with 7 scraper modules, hydration extraction, HTTP/API clients, parsers, processors, and utils. All 38 unit tests pass, but they test components in isolation using minimal fixture snippets. No tests verify that the full pipeline (fetch HTML -> extract hydration -> parse data) works against realistic TikTok responses. The existing test fixtures (`tests/fixtures/`) contain JSON data structures but no full HTML pages. Vitest is configured to run all tests under `tests/` with a single `npm run test` command.

## Goals / Non-Goals

**Goals:**
- Validate the hydration extractor correctly parses real full-page TikTok HTML
- Validate TikTokWebClient methods produce correct parsed output when HTTP is mocked with real HTML responses
- Validate TikTokApiClient methods produce correct parsed output when HTTP is mocked with real JSON responses
- Validate all 7 parsers handle real TikTok data structures without errors
- Validate URL resolver handles short URL redirects correctly with mocked HTTP
- Provide a separate `test:integration` npm script so integration tests can run independently
- Keep integration tests deterministic (no real network calls)

**Non-Goals:**
- End-to-end tests that hit live TikTok servers
- Browser-based (Playwright) integration testing
- Performance or load testing
- Testing Apify SDK integration (Actor, crawlers, proxy configuration)
- Achieving 100% code coverage with integration tests

## Decisions

### 1. Mock HTTP at the got-scraping level, not at the network level

**Decision**: Use `vi.mock('got-scraping')` to intercept HTTP calls and return fixture data, rather than using tools like nock or MSW to intercept at the network layer.

**Rationale**: The project already uses `vi.mock` patterns in unit tests. Mocking got-scraping directly is simpler, has no additional dependencies, and is sufficient since the goal is to test parsing pipelines, not HTTP behavior. Alternative considered: nock/MSW would add dependencies and complexity without meaningful benefit for this use case.

### 2. Full HTML fixtures stored as separate .html files

**Decision**: Store captured TikTok HTML pages as `.html` files in `tests/fixtures/html/` rather than inline strings or snapshots.

**Rationale**: Real TikTok HTML pages are large (100KB+). Separate files keep test code readable, are easy to update, and can be inspected independently. The existing JSON fixtures already use the separate-file pattern. Alternative considered: inline template literals would bloat test files and make diffs unreadable.

### 3. Vitest workspace configuration for test separation

**Decision**: Use vitest `include` patterns with separate config projects to separate unit and integration tests, adding a `test:integration` script that targets `tests/integration/**/*.test.ts`.

**Rationale**: Vitest supports project-level include patterns natively. The current config uses `tests/**/*.test.ts` which will automatically pick up integration tests for the default `npm run test`. A dedicated script uses `--include` or a config override to run only integration tests. Alternative considered: separate vitest config files would work but add unnecessary config duplication.

### 4. One integration test file per client/component boundary

**Decision**: Create separate test files for hydration-extractor integration, web-client integration, api-client integration, parser integration, and url-resolver integration.

**Rationale**: Mirrors the unit test structure and keeps test scope clear. Each file tests a specific integration boundary. Alternative considered: a single large integration test file would be harder to maintain and debug.

## Risks / Trade-offs

- **[Fixture staleness]** Real TikTok HTML/JSON structures change over time as TikTok updates their frontend. → Mitigation: Document the capture date in fixtures, keep fixtures minimal (only the necessary `<script>` tags and surrounding structure for HTML), and design tests to validate structure rather than exact values.

- **[Fixture size]** Full HTML pages may be large and inflate the repository. → Mitigation: Store trimmed HTML that retains the hydration `<script>` tag and minimal surrounding structure. Keep only one fixture per page type.

- **[Mock fidelity]** Mocking got-scraping means HTTP error handling, retries, and rate limiting are not exercised. → Mitigation: Acceptable since unit tests already cover retry-handler and rate-limiter. Integration tests focus on data flow correctness.

- **[RateLimiter side effects in tests]** TikTokWebClient and TikTokApiClient constructors create RateLimiter instances that use real timers. → Mitigation: Mock or configure RateLimiter with zero delay for tests, or mock the `waitForSlot` method to resolve immediately.
