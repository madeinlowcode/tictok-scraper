## ADDED Requirements

### Requirement: Engagement calculator computes derived metrics
The `calculateEngagement` function SHALL compute `EngagementMetrics` from a profile and its videos: avgViews, avgLikes, avgComments, avgShares, engagementRate ((likes+comments+shares)/views*100), likeToViewRatio, commentToViewRatio, shareToViewRatio, estimatedReach.

#### Scenario: Calculate engagement for profile with videos
- **WHEN** `calculateEngagement(profile, videos)` is called with a profile and 10 videos
- **THEN** it returns `EngagementMetrics` with correctly averaged stats and calculated ratios

#### Scenario: Calculate engagement with zero views
- **WHEN** videos have zero total views
- **THEN** engagement rates and ratios return 0 instead of NaN or Infinity

#### Scenario: Calculate engagement with empty video list
- **WHEN** `calculateEngagement(profile, [])` is called with no videos
- **THEN** all averages and rates return 0

### Requirement: Data cleaner normalizes output data
The `cleanData` function SHALL remove undefined/null fields, convert UNIX timestamps to ISO 8601, clean URLs by removing tracking parameters, and treat zero values for hidden stats as null.

#### Scenario: Clean video output with tracking URLs
- **WHEN** `cleanData` receives a video output with tracking params in URLs
- **THEN** URLs are cleaned of tracking parameters

#### Scenario: Clean data with zero hidden stats
- **WHEN** a stat field is 0 but the TikTok account has the stat hidden
- **THEN** the field is set to null/undefined instead of 0

#### Scenario: Timestamp normalization
- **WHEN** a createTime is a UNIX timestamp (seconds)
- **THEN** createTimeISO is set to the corresponding ISO 8601 string
