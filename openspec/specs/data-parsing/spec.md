## ADDED Requirements

### Requirement: Video parser transforms raw data to VideoOutput
The `parseVideo` function SHALL be a pure function that maps raw TikTok video data (itemStruct) to a `VideoOutput` object. It SHALL extract: videoId, description, createTime, duration, coverUrl, playUrl, stats, hashtags, author, music, isAd, locationCreated. Timestamps SHALL be converted from UNIX seconds to ISO 8601.

#### Scenario: Parse complete video data
- **WHEN** `parseVideo` receives a valid raw video object
- **THEN** it returns a `VideoOutput` with all fields mapped correctly and createTimeISO as ISO 8601 string

#### Scenario: Parse video with missing optional fields
- **WHEN** `parseVideo` receives data with undefined playUrl or locationCreated
- **THEN** it returns a `VideoOutput` with those fields as undefined, without throwing

### Requirement: Profile parser transforms raw data to ProfileOutput
The `parseProfile` function SHALL be a pure function that maps raw TikTok profile data (userInfo) to `ProfileOutput`, including user details and stats (followerCount, followingCount, heartCount, videoCount).

#### Scenario: Parse complete profile data
- **WHEN** `parseProfile` receives valid userInfo data
- **THEN** it returns a `ProfileOutput` with all user fields and stats mapped

### Requirement: Comment parser transforms raw data to CommentOutput
The `parseComment` function SHALL be a pure function mapping raw comment data to `CommentOutput` with commentId, text, author, likeCount, replyCount, createTime/ISO, isAuthorLiked.

#### Scenario: Parse comment with replies
- **WHEN** `parseComment` receives a comment with replyCount > 0
- **THEN** it returns a `CommentOutput` with the correct replyCount

### Requirement: Hashtag parser transforms raw data to HashtagOutput
The `parseHashtag` function SHALL map raw hashtag data to `HashtagOutput` with hashtagId, name, viewCount, videoCount, description, coverUrl.

#### Scenario: Parse hashtag with metadata
- **WHEN** `parseHashtag` receives valid hashtag data
- **THEN** it returns a `HashtagOutput` with all fields

### Requirement: Search parser transforms raw results to VideoOutput array
The `parseSearchResults` function SHALL map an array of raw search results to `VideoOutput[]`.

#### Scenario: Parse search results
- **WHEN** `parseSearchResults` receives an array of raw search items
- **THEN** it returns an array of `VideoOutput` objects

### Requirement: Sound parser transforms raw data to SoundOutput
The `parseSound` function SHALL map raw sound/music data to `SoundOutput` with musicId, title, authorName, albumName, duration, isOriginal, coverUrl, playUrl, videoCount.

#### Scenario: Parse sound data
- **WHEN** `parseSound` receives valid sound data
- **THEN** it returns a `SoundOutput` with all fields mapped

### Requirement: All parsers are pure functions without side effects
Parsers SHALL NOT make HTTP requests, modify global state, or import Apify SDK. They SHALL only transform data.

#### Scenario: Parser does not depend on external state
- **WHEN** `parseVideo` is called twice with the same input
- **THEN** it returns identical output both times
