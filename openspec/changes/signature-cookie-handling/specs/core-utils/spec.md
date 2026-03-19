## MODIFIED Requirements

### Requirement: Cookie manager maintains session cookies
The cookie manager SHALL obtain initial cookies by visiting TikTok homepage, store them for reuse across requests, and refresh when expired. It SHALL maintain a pool of multiple cookie sets (configurable pool size, default 5) and rotate through them in round-robin order. It SHALL support persistence via an injectable `CookieStore` interface with `load()` and `save()` methods. It SHALL detect 403 and captcha responses and automatically invalidate the offending cookie set, replacing it with a fresh one.

#### Scenario: Get session cookies
- **WHEN** `getSessionCookies()` is called for the first time
- **THEN** it makes a GET to tiktok.com and captures the Set-Cookie headers

#### Scenario: Reuse existing cookies
- **WHEN** `getSessionCookies()` is called again within session
- **THEN** it returns cached cookies without making a new request

#### Scenario: Round-robin cookie rotation
- **WHEN** `getNextCookieSet()` is called multiple times
- **THEN** it cycles through the cookie pool in round-robin order, returning a different cookie set each time until wrapping around

#### Scenario: Cookie pool initialization
- **WHEN** the cookie manager is initialized with a pool size of 3
- **THEN** it creates 3 independent cookie sets by making 3 separate requests to TikTok

#### Scenario: Invalidate cookie set on 403 response
- **WHEN** `invalidateCookieSet(index)` is called for a cookie set that received a 403 response
- **THEN** the cookie manager removes that set from the pool and fetches a replacement cookie set

#### Scenario: Persist cookies via CookieStore
- **WHEN** the cookie manager is initialized with a `CookieStore` implementation
- **THEN** it calls `store.load()` on initialization to restore previously saved cookies and calls `store.save()` after each pool modification

#### Scenario: Default in-memory store when no CookieStore provided
- **WHEN** the cookie manager is initialized without a `CookieStore`
- **THEN** it uses an in-memory store and cookies are not persisted between restarts

## ADDED Requirements

### Requirement: CookieStore interface for persistence abstraction
The cookie manager module SHALL define a `CookieStore` interface with `load(): Promise<CookiePool | null>` and `save(pool: CookiePool): Promise<void>` methods. This interface SHALL be implemented by consumers (e.g., Apify KeyValueStore adapter in `main.ts`) to enable platform-specific persistence.

#### Scenario: CookieStore load returns saved pool
- **WHEN** `store.load()` is called and a previously saved cookie pool exists
- **THEN** it returns the deserialized `CookiePool` object

#### Scenario: CookieStore load returns null when empty
- **WHEN** `store.load()` is called and no saved cookie pool exists
- **THEN** it returns `null`, signaling the cookie manager to create a fresh pool
