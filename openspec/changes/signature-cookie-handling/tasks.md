## 1. Types and Interfaces

- [x] 1.1 Add `CookieStore` interface with `load()` and `save()` methods to `src/types/index.ts`
- [x] 1.2 Add `CookiePool` type (array of cookie sets with metadata) to `src/types/index.ts`
- [x] 1.3 Add `SignedUrlResult` interface with `signedUrl` and `requiresBrowserFallback` fields to `src/types/index.ts`
- [x] 1.4 Add `SignatureGeneratorConfig` interface to `src/types/index.ts`

## 2. Cookie Manager Enhancement

- [x] 2.1 Refactor `CookieManager` to maintain a pool of cookie sets instead of a single set
- [x] 2.2 Implement `getNextCookieSet()` method with round-robin rotation across the pool
- [x] 2.3 Implement parallel cookie pool initialization (N concurrent requests to TikTok)
- [x] 2.4 Implement `invalidateCookieSet(index)` to remove a flagged set and fetch a replacement
- [x] 2.5 Add `CookieStore` injection via constructor and call `load()`/`save()` on pool changes
- [x] 2.6 Implement default in-memory `CookieStore` for when no external store is provided

## 3. Signature Generator

- [x] 3.1 Create `src/utils/signature-generator.ts` with `SignatureGenerator` class
- [x] 3.2 Implement `getMsToken()` that extracts msToken from cookies with caching and TTL tracking
- [x] 3.3 Implement `generateXBogus(url, params)` using extracted JS logic in isolated context, returning `null` on failure
- [x] 3.4 Implement `signUrl(baseUrl, params)` that combines msToken and X-Bogus into a `SignedUrlResult`
- [x] 3.5 Verify no Apify SDK imports exist in the module

## 4. API Client Integration

- [x] 4.1 Inject `SignatureGenerator` into `TikTokApiClient` constructor
- [x] 4.2 Update `apiRequest()` to call `signUrl()` before making HTTP requests
- [x] 4.3 Update `apiRequest()` to use `getNextCookieSet()` for cookie rotation on each request
- [x] 4.4 Add 403 response detection: invalidate current cookie set and set `requiresBrowserFallback` flag on result
- [x] 4.5 Propagate `requiresBrowserFallback` flag from signature generator through API response objects
- [x] 4.6 Update response types for `getProfileVideos`, `getComments`, `search` to include optional `requiresBrowserFallback` field

## 5. Apify Integration Layer

- [x] 5.1 Create `CookieStore` implementation backed by Apify KeyValueStore in `src/main.ts`
- [x] 5.2 Wire `CookieStore` and `SignatureGenerator` into client initialization in `main.ts`

## 6. Tests

- [x] 6.1 Add unit tests for `SignatureGenerator.getMsToken()` (extraction, caching, expiry, missing token)
- [x] 6.2 Add unit tests for `SignatureGenerator.generateXBogus()` (success and graceful failure)
- [x] 6.3 Add unit tests for `SignatureGenerator.signUrl()` (all-tokens, no-xbogus-fallback, no-mstoken)
- [x] 6.4 Add unit tests for `CookieManager` pool rotation (round-robin, invalidation, replacement)
- [x] 6.5 Add unit tests for `CookieManager` persistence (load/save via CookieStore interface)
- [x] 6.6 Add integration tests for `TikTokApiClient` with mocked signature generator verifying signed URLs and fallback flags
