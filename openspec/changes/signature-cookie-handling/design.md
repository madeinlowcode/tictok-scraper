## Context

The TikTok Scraper Pro uses a 3-layer extraction strategy. Layer 1 (hydration data from HTML) works reliably, but Layer 2 (internal APIs) is currently unreliable because TikTok requires dynamic security tokens on API endpoints. The `TikTokApiClient` sends requests with only basic cookies and no signature tokens, resulting in 403 responses and captcha challenges on endpoints like `/api/post/item_list/`, `/api/comment/list/`, and `/api/search/general/full/`.

The current `CookieManager` holds a single cookie set with TTL-based expiry. There is no cookie rotation, no persistence between runs, and no `signature-generator.ts` file exists yet.

## Goals / Non-Goals

**Goals:**
- Reliably generate or extract msToken and X-Bogus tokens for Layer 2 API requests
- Rotate cookies across a pool of sessions to reduce per-session request volume and avoid triggering anti-bot defenses
- Persist cookie pool across scraper restarts using a key-value store interface
- Automatically detect signature/cookie failures (403, captcha) and flag requests for Layer 3 (Playwright) fallback
- Keep signature and cookie logic in `src/utils/` with no Apify SDK imports

**Non-Goals:**
- Full reverse-engineering of TikTok's obfuscated JS signature algorithms (we extract tokens from page loads instead)
- Implementing CAPTCHA solving
- Replacing Layer 2 entirely with Layer 3 browser-based extraction
- Handling TikTok login or authenticated sessions

## Decisions

### Decision 1: Extract msToken from cookies rather than computing it

**Choice**: Extract msToken from Set-Cookie headers when visiting TikTok pages, rather than reverse-engineering its generation algorithm.

**Rationale**: msToken is set by TikTok's server in response cookies. Extracting it is reliable and does not break when TikTok updates their JS. Computing it would require reverse-engineering obfuscated code that changes frequently.

**Alternative considered**: Reverse-engineer the msToken generation from TikTok's JS bundles. Rejected because maintenance cost is high and the token changes with each TikTok deployment.

### Decision 2: Generate X-Bogus using a lightweight JS evaluation approach

**Choice**: Extract the X-Bogus generation logic from TikTok's frontend JS and execute it in an isolated context (Node.js vm module or extracted function). Fall back to Playwright page evaluation if the extracted logic becomes stale.

**Rationale**: X-Bogus is computed client-side from the request URL and parameters. A lightweight extraction avoids spinning up a full browser for every API call while still producing valid tokens.

**Alternative considered**: Always use Playwright to generate X-Bogus. Rejected because it adds 2-5 seconds per request and defeats the purpose of Layer 2's speed advantage.

### Decision 3: Cookie pool with round-robin rotation

**Choice**: Maintain a pool of N cookie sets (default 5), obtained by making N separate visits to TikTok. Rotate through them in round-robin order for API requests.

**Rationale**: Distributing requests across multiple cookie sessions reduces the chance of any single session being flagged. Round-robin is simple, predictable, and sufficient given the rate limiter already throttles overall volume.

**Alternative considered**: Random selection from pool. Rejected because round-robin ensures even distribution without needing additional tracking.

### Decision 4: Persistence via a storage-agnostic interface

**Choice**: Define a `CookieStore` interface with `load()` and `save()` methods. Provide an in-memory default and allow `main.ts` to inject an Apify KeyValueStore-backed implementation.

**Rationale**: Keeps `cookie-manager.ts` free of Apify SDK imports (project rule) while enabling persistence when running on the Apify platform.

### Decision 5: Fallback signaling via return type, not exceptions

**Choice**: When signature generation fails or a signed request returns 403, the API client returns a result object with a `requiresBrowserFallback: true` flag instead of throwing.

**Rationale**: This lets the scraper modules decide how to handle the fallback (queue for Playwright, skip, etc.) without coupling the API client to the crawler infrastructure.

**Alternative considered**: Throw a specific `SignatureFailedError`. Rejected because the caller would need try-catch logic and the control flow is clearer with a flag.

## Risks / Trade-offs

- **[Risk] TikTok changes X-Bogus algorithm** → Mitigation: The Playwright fallback generates tokens via real browser context. Monitoring test failures will signal when the extracted logic needs updating.
- **[Risk] Cookie pool initialization is slow (N HTTP requests)** → Mitigation: Initialize pool lazily and in parallel. Start with 1 cookie set and expand pool in background.
- **[Risk] msToken expires mid-session** → Mitigation: Track msToken TTL (typically ~2 hours) and refresh proactively before expiry.
- **[Trade-off] Lightweight X-Bogus generation vs. full browser** → Accepted because speed matters for Layer 2; fallback covers failure cases.
