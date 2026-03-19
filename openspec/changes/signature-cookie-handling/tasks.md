## 1. Types and Interfaces

- [ ] 1.1 Add `CookieStore` interface with `load()` and `save()` methods to `src/types/index.ts`
- [ ] 1.2 Add `CookiePool` type (array of cookie sets with metadata) to `src/types/index.ts`
- [ ] 1.3 Add `SignedUrlResult` interface with `signedUrl` and `requiresBrowserFallback` fields to `src/types/index.ts`
- [ ] 1.4 Add `SignatureGeneratorConfig` interface to `src/types/index.ts`

## 2. Cookie Manager Enhancement

- [ ] 2.1 Refactor `CookieManager` to maintain a pool of cookie sets instead of a single set
- [ ] 2.2 Implement `getNextCookieSet()` method with round-robin rotation across the pool
- [ ] 2.3 Implement parallel cookie pool initialization (N concurrent requests to TikTok)
- [ ] 2.4 Implement `invalidateCookieSet(index)` to remove a flagged set and fetch a replacement
- [ ] 2.5 Add `CookieStore` injection via constructor and call `load()`/`save()` on pool changes
- [ ] 2.6 Implement default in-memory `CookieStore` for when no external store is provided

## 3. Signature Generator

- [ ] 3.1 Create `src/utils/signature-generator.ts` with `SignatureGenerator` class
- [ ] 3.2 Implement `getMsToken()` that extracts msToken from cookies with caching and TTL tracking
- [ ] 3.3 Implement `generateXBogus(url, params)` using extracted JS logic in isolated context, returning `null` on failure
- [ ] 3.4 Implement `signUrl(baseUrl, params)` that combines msToken and X-Bogus into a `SignedUrlResult`
- [ ] 3.5 Verify no Apify SDK imports exist in the module

## 4. API Client Integration

- [ ] 4.1 Inject `SignatureGenerator` into `TikTokApiClient` constructor
- [ ] 4.2 Update `apiRequest()` to call `signUrl()` before making HTTP requests
- [ ] 4.3 Update `apiRequest()` to use `getNextCookieSet()` for cookie rotation on each request
- [ ] 4.4 Add 403 response detection: invalidate current cookie set and set `requiresBrowserFallback` flag on result
- [ ] 4.5 Propagate `requiresBrowserFallback` flag from signature generator through API response objects
- [ ] 4.6 Update response types for `getProfileVideos`, `getComments`, `search` to include optional `requiresBrowserFallback` field

## 5. Apify Integration Layer

- [ ] 5.1 Create `CookieStore` implementation backed by Apify KeyValueStore in `src/main.ts`
- [ ] 5.2 Wire `CookieStore` and `SignatureGenerator` into client initialization in `main.ts`

## 6. Tests

- [ ] 6.1 Add unit tests for `SignatureGenerator.getMsToken()` (extraction, caching, expiry, missing token)
- [ ] 6.2 Add unit tests for `SignatureGenerator.generateXBogus()` (success and graceful failure)
- [ ] 6.3 Add unit tests for `SignatureGenerator.signUrl()` (all-tokens, no-xbogus-fallback, no-mstoken)
- [ ] 6.4 Add unit tests for `CookieManager` pool rotation (round-robin, invalidation, replacement)
- [ ] 6.5 Add unit tests for `CookieManager` persistence (load/save via CookieStore interface)
- [ ] 6.6 Add integration tests for `TikTokApiClient` with mocked signature generator verifying signed URLs and fallback flags
