## 1. Fixtures Setup

- [ ] 1.1 Create `tests/fixtures/html/` directory structure
- [ ] 1.2 Create profile page HTML fixture (`tests/fixtures/html/profile-page.html`) with realistic `__UNIVERSAL_DATA_FOR_REHYDRATION__` script tag containing `webapp.user-detail` scope with `userInfo`, `user`, and `stats` data
- [ ] 1.3 Create video page HTML fixture (`tests/fixtures/html/video-page.html`) with hydration script containing `webapp.video-detail` scope with `itemInfo.itemStruct` including `id`, `desc`, `author`, and `stats`
- [ ] 1.4 Create hashtag page HTML fixture (`tests/fixtures/html/hashtag-page.html`) with hydration script containing `webapp.hashtag-detail` scope with challenge data

## 2. Test Infrastructure

- [ ] 2.1 Add `test:integration` script to `package.json` targeting `tests/integration/**/*.test.ts`
- [ ] 2.2 Create `tests/integration/` directory
- [ ] 2.3 Create shared test helper (`tests/integration/helpers.ts`) with fixture loading utilities and got-scraping mock setup for both HTML and JSON responses

## 3. Hydration Extractor Integration Tests

- [ ] 3.1 Create `tests/integration/hydration-extractor.integration.test.ts`
- [ ] 3.2 Add test: extract hydration data from full profile HTML fixture and verify `webapp.user-detail` scope contains `userInfo` with `user` and `stats` sub-objects
- [ ] 3.3 Add test: extract hydration data from full video HTML fixture and verify `webapp.video-detail` scope contains `itemInfo.itemStruct` with `id`, `desc`, `author`, and `stats`
- [ ] 3.4 Add test: extract hydration data from full hashtag HTML fixture and verify `webapp.hashtag-detail` scope contains challenge information

## 4. TikTokWebClient Integration Tests

- [ ] 4.1 Create `tests/integration/tiktok-web-client.integration.test.ts`
- [ ] 4.2 Mock `got-scraping` and `RateLimiter.waitForSlot` to return immediately
- [ ] 4.3 Add test: `fetchProfile` with mocked HTML returns `RawProfileData` with valid `user` and `stats` fields
- [ ] 4.4 Add test: `fetchVideo` with mocked HTML returns `RawVideoData` with valid `id`, `desc`, `author`, and `stats` fields
- [ ] 4.5 Add test: `fetchHashtag` with mocked HTML returns `RawHashtagData` with valid challenge data

## 5. TikTokApiClient Integration Tests

- [ ] 5.1 Create `tests/integration/tiktok-api-client.integration.test.ts`
- [ ] 5.2 Mock `got-scraping` to return JSON fixture data and mock `RateLimiter.waitForSlot`
- [ ] 5.3 Add test: `getProfileVideos` returns `RawVideoListResponse` with `itemList` array, `hasMore` boolean, and `cursor` string
- [ ] 5.4 Add test: `getComments` returns `RawCommentListResponse` with `comments` array, `has_more` boolean, `cursor` number, and `total` number
- [ ] 5.5 Add test: `search` returns `RawSearchResponse` with `data` array, `has_more` boolean, and `cursor` string
- [ ] 5.6 Add test: `getTrendingHashtags` returns `RawTrendingResponse` with trending items from Creative Center fixture

## 6. Parser Integration Tests

- [ ] 6.1 Create `tests/integration/parsers.integration.test.ts`
- [ ] 6.2 Add test: profile parser produces parsed profile with username, display name, follower count, and video count from hydration-extracted fixture data
- [ ] 6.3 Add test: video parser produces parsed video with video ID, description, author info, and engagement stats from hydration-extracted fixture data
- [ ] 6.4 Add test: comment parser produces parsed comments array with text, author, and like count from API fixture data
- [ ] 6.5 Add test: hashtag parser produces parsed hashtag with name and view count from hydration-extracted fixture data
- [ ] 6.6 Add test: search parser produces parsed search results array from API fixture data
- [ ] 6.7 Add test: sound parser produces parsed sound with title and author info from fixture data
- [ ] 6.8 Add test: trending data from Creative Center fixture produces structured trending items with names and counts

## 7. URL Resolver Integration Tests

- [ ] 7.1 Create `tests/integration/url-resolver.integration.test.ts`
- [ ] 7.2 Add test: short URL (`https://vm.tiktok.com/ABC123/`) resolves to full video URL when HTTP mock returns 301 redirect
- [ ] 7.3 Add test: full TikTok URL passes through unchanged without HTTP call

## 8. Validation

- [ ] 8.1 Run `npm run test:integration` and verify only integration tests execute
- [ ] 8.2 Run `npm run test` and verify both unit and integration tests execute
- [ ] 8.3 Verify all integration tests pass
