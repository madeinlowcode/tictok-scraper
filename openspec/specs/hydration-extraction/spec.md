## ADDED Requirements

### Requirement: Extract hydration JSON from TikTok HTML
The hydration extractor SHALL parse HTML pages and extract the JSON content from `<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application/json">`, returning the `__DEFAULT_SCOPE__` object.

#### Scenario: Valid HTML with hydration script
- **WHEN** `extractHydrationData` receives HTML containing a valid `__UNIVERSAL_DATA_FOR_REHYDRATION__` script tag
- **THEN** it returns the parsed `__DEFAULT_SCOPE__` object

#### Scenario: HTML without hydration script
- **WHEN** `extractHydrationData` receives HTML without the expected script tag
- **THEN** it throws a `HydrationExtractionError` with a descriptive message

#### Scenario: Malformed JSON in script tag
- **WHEN** the script tag contains invalid JSON
- **THEN** it throws a `HydrationExtractionError` indicating parse failure

### Requirement: Extract video data from hydration
The extractor SHALL provide `extractVideoFromHydration(data)` that navigates to `data["webapp.video-detail"].itemInfo.itemStruct` and returns raw video data.

#### Scenario: Video data present in hydration
- **WHEN** hydration data contains `webapp.video-detail` scope
- **THEN** `extractVideoFromHydration` returns the itemStruct object

#### Scenario: Video data missing from hydration
- **WHEN** hydration data does not contain `webapp.video-detail`
- **THEN** it throws `HydrationExtractionError`

### Requirement: Extract profile data from hydration
The extractor SHALL provide `extractProfileFromHydration(data)` that navigates to `data["webapp.user-detail"].userInfo`.

#### Scenario: Profile data present in hydration
- **WHEN** hydration data contains `webapp.user-detail` scope
- **THEN** `extractProfileFromHydration` returns the userInfo object

### Requirement: Extract hashtag data from hydration
The extractor SHALL provide `extractHashtagFromHydration(data)` that navigates to `data["webapp.hashtag-detail"]`.

#### Scenario: Hashtag data present in hydration
- **WHEN** hydration data contains `webapp.hashtag-detail` scope
- **THEN** `extractHashtagFromHydration` returns the hashtag detail object
