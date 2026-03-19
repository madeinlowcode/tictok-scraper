## Context

TikTok Scraper Pro has all 7 modules implemented and passing unit tests. The project needs deployment polish before Apify Store publication: documentation, input validation, error UX, end-to-end tests, and configuration tuning. The existing `main.ts` already handles routing and PPE billing but lacks input validation and user-friendly errors. The Dockerfile is functional but not optimized. The `.actor/actor.json` has minimal metadata.

## Goals / Non-Goals

**Goals:**
- Make the Actor ready for Apify Store publication with professional documentation
- Validate all inputs before processing to fail fast with clear messages
- Provide user-friendly error messages for common failure modes (invalid URLs, rate limits, geo-blocks)
- Add end-to-end tests that verify the full Actor flow with mocked Apify environment
- Optimize Dockerfile for smaller image size and faster builds
- Polish `.actor/actor.json` for Apify Store SEO discoverability
- Verify PPE pricing matches PRD specification
- Add CHANGELOG.md for release tracking

**Non-Goals:**
- Changing scraper module internals or adding new scraping capabilities
- Adding a web UI or dashboard
- Supporting non-Apify deployment targets
- Implementing real browser-based E2E tests against live TikTok

## Decisions

### 1. Input validation in main.ts (not a separate module)

Validation logic will be added directly to `main.ts` since it is the only file that uses Apify SDK and handles input. A lightweight `validateInput()` function will be defined in main.ts that checks URLs, required fields, and types before any scraping begins. This avoids creating a new module that would need Apify SDK imports.

**Alternative considered:** Creating `src/utils/input-validator.ts` — rejected because validation needs to produce Actor-specific error messages and the function is small enough to live in main.ts.

### 2. User-friendly error wrapping with error classification

Errors will be classified into categories (INVALID_INPUT, RATE_LIMITED, GEO_BLOCKED, NOT_FOUND, NETWORK_ERROR, UNKNOWN) and wrapped with user-facing messages. The catch blocks in main.ts will detect error types from HTTP status codes and error messages, then log user-friendly descriptions.

**Alternative considered:** Custom error classes throughout the codebase — rejected as too invasive for a polish change. Error classification at the main.ts boundary is sufficient.

### 3. E2E tests with vi.mock for Apify SDK

End-to-end tests will mock `apify` module using Vitest's `vi.mock`. Tests will verify the full flow: input → routing → scraping → Actor.pushData → Actor.charge. Scraper functions will also be mocked to return fixture data, isolating the test to main.ts orchestration logic.

**Alternative considered:** Using Apify's test utilities — they don't provide a full mock Actor environment. Vitest mocking is simpler and more maintainable.

### 4. Multi-stage Dockerfile

Convert the single-stage Dockerfile to a multi-stage build: build stage compiles TypeScript, runtime stage copies only compiled JS and production node_modules. This reduces image size by excluding TypeScript source, dev dependencies, and build tools.

**Alternative considered:** Keeping single-stage with .dockerignore — multi-stage is cleaner and produces a smaller image.

### 5. README structure mirrors Apify Store conventions

The README will follow Apify Store best practices: short intro, feature list, input/output examples for each module, pricing table, FAQ, and comparison table. This maximizes Store conversion and reduces support questions.

## Risks / Trade-offs

- **[Risk] Input validation may reject valid edge-case URLs** → Mitigation: Use permissive URL patterns (check domain only, not full path structure) and log warnings for unrecognized patterns instead of hard failing.
- **[Risk] Mocked E2E tests may not catch real Apify platform issues** → Mitigation: These tests verify orchestration logic; real platform testing happens via `apify run` during development.
- **[Risk] Multi-stage Dockerfile may break if build output paths change** → Mitigation: Use explicit COPY paths matching tsconfig.json outDir.
- **[Trade-off] Error classification is heuristic-based** → Acceptable for MVP; can be refined based on real user error reports after launch.
