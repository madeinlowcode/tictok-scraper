## Context

The TikTok Scraper Pro uses a layered extraction strategy: Layer 1 (hydration data from HTML via got-scraping) and Layer 2 (internal TikTok APIs). Both layers rely on HTTP requests that can be blocked by TikTok's anti-bot systems (signature validation, CAPTCHA, IP reputation). When both layers fail, the scraper currently has no recourse. PlaywrightCrawler from the Crawlee framework provides a headless browser that can render pages like a real user, bypass JavaScript challenges, and intercept network responses containing API data.

## Goals / Non-Goals

**Goals:**
- Provide a reliable Layer 3 fallback using PlaywrightCrawler that activates only when Layers 1 and 2 fail
- Intercept XHR/fetch responses in the browser context to extract structured API data without DOM scraping
- Extract authentication tokens and cookies from the browser session and inject them into HTTP clients
- Keep the browser client in `src/clients/tiktok-browser.ts`, separate from Apify SDK usage in `main.ts`
- Integrate fallback into all 7 scraper modules with minimal code duplication

**Non-Goals:**
- Using the browser as the primary extraction method (it is strictly a fallback)
- Solving CAPTCHA challenges programmatically (if CAPTCHA appears in browser, the request fails)
- Implementing browser pooling or persistent browser sessions across runs
- Adding Playwright as a separate npm dependency (it comes with Crawlee's PlaywrightCrawler)

## Decisions

### Decision 1: Fallback orchestration via `withFallback` utility function

Create a generic `withFallback<T>(layers: Array<() => Promise<T>>)` utility that tries each layer in order, catching errors and escalating to the next layer. This avoids duplicating try/catch/fallback logic in each scraper.

**Alternatives considered:**
- Per-scraper inline fallback: Would duplicate the same pattern 7 times.
- Event-based fallback: Over-engineered for sequential escalation.

### Decision 2: XHR interception over DOM scraping

The browser client SHALL intercept `response` events on the Playwright page to capture API responses (matching TikTok API URL patterns) rather than parsing rendered DOM. This yields the same structured JSON that Layer 2 would return, keeping parser compatibility.

**Alternatives considered:**
- DOM scraping with Cheerio on rendered HTML: Fragile, different data shape than API responses, harder to maintain.
- Using `page.evaluate` to read `window.__UNIVERSAL_DATA_FOR_REHYDRATION__`: Works for hydration data but misses paginated API calls triggered by scroll.

### Decision 3: Token extraction and injection pattern

After a successful browser session, extract `tt_webid`, `msToken`, and cookie values via `page.context().cookies()`. Store these in a `TokenStore` object that HTTP clients can consume. Clients accept an optional `tokenStore` parameter; when present, they include these tokens in subsequent requests.

**Alternatives considered:**
- Global singleton for tokens: Makes testing harder and creates hidden coupling.
- Passing tokens through scraper return values: Pollutes the data layer with infrastructure concerns.

### Decision 4: Browser client lives in `src/clients/tiktok-browser.ts`

Playwright is part of Crawlee (not Apify SDK), so the browser client belongs in the clients layer. It imports `PlaywrightCrawler` from `crawlee`. The `main.ts` file initializes the browser client and passes it to scrapers alongside the web and API clients.

### Decision 5: Lazy browser initialization

The PlaywrightCrawler instance is created only when Layer 3 is first needed, not at startup. This avoids the overhead of launching a browser when Layers 1 and 2 succeed.

**Alternatives considered:**
- Eager initialization: Wastes resources when fallback is never triggered (the common case).

## Risks / Trade-offs

- **[Performance]** Browser fallback is 10-50x slower than HTTP requests → Mitigation: Only used after Layers 1 and 2 fail; token extraction helps future HTTP requests succeed.
- **[Resource usage]** Playwright consumes significant memory (~200-400MB per browser) → Mitigation: Single browser instance shared across requests; lazy initialization; browser closed after extraction.
- **[Flakiness]** TikTok's SPA may change rendering behavior → Mitigation: XHR interception is more stable than DOM scraping; URL pattern matching is version-independent.
- **[Token staleness]** Extracted tokens may expire quickly → Mitigation: TokenStore tracks extraction time; clients re-trigger browser fallback when tokens are expired.
