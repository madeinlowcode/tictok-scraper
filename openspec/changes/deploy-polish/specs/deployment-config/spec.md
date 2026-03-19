## ADDED Requirements

### Requirement: Complete README with usage examples
The project SHALL include a README.md with: project description, features list, usage examples for all 7 modules (profile, video, comment, hashtag, search, trending, sound), input/output JSON samples, PPE pricing table, FAQ section, and competitor comparison table (vs Clockworks).

#### Scenario: README contains usage example for each module
- **WHEN** a user reads README.md
- **THEN** they find at least one input/output JSON example for each of the 7 scraper modules

#### Scenario: README contains pricing table
- **WHEN** a user reads the pricing section of README.md
- **THEN** they find a table with per-event costs: profile $0.003, video $0.002, comment $0.0003, search $0.001, trending $0.002, hashtag $0.003, sound $0.002, and free tier of 50 items

#### Scenario: README contains competitor comparison
- **WHEN** a user reads the comparison section
- **THEN** they find a table comparing TikTok Scraper Pro features against Clockworks TikTok Scraper

### Requirement: CHANGELOG for release tracking
The project SHALL include a CHANGELOG.md following Keep a Changelog format with an entry for version 1.0.0 documenting the MVP release and all 7 modules.

#### Scenario: CHANGELOG documents MVP release
- **WHEN** a developer reads CHANGELOG.md
- **THEN** they find a 1.0.0 entry listing all 7 scraper modules as added features

### Requirement: Optimized multi-stage Dockerfile
The Dockerfile SHALL use a multi-stage build: a build stage that compiles TypeScript and a runtime stage that copies only compiled JavaScript and production dependencies. The runtime stage SHALL use the `apify/actor-node:20` base image.

#### Scenario: Dockerfile produces minimal runtime image
- **WHEN** the Docker image is built
- **THEN** the final image does not contain TypeScript source files or devDependencies

#### Scenario: Dockerfile build stage compiles TypeScript
- **WHEN** the build stage runs
- **THEN** it executes `npm run build` and produces JavaScript output in the configured outDir

### Requirement: Polished actor.json with SEO metadata
The `.actor/actor.json` SHALL include an SEO-optimized title (max 70 chars), a detailed description (150-300 chars) mentioning key features and Brazil focus, and a `categories` array with relevant Apify Store categories.

#### Scenario: actor.json has SEO-friendly title
- **WHEN** the actor.json is loaded
- **THEN** the title is descriptive, under 70 characters, and includes "TikTok"

#### Scenario: actor.json has detailed description
- **WHEN** the actor.json is loaded
- **THEN** the description mentions profiles, videos, comments, hashtags, trending, Brazil, and engagement metrics

### Requirement: PPE pricing configuration matches PRD
The Pay per Event configuration SHALL define event prices matching the PRD: profile-scraped $0.003, video-scraped $0.002, comment-scraped $0.0003, search-result $0.001, trending-item $0.002, hashtag-scraped $0.003, sound-scraped $0.002. A free tier of 50 items SHALL be configured.

#### Scenario: PPE events match PRD pricing
- **WHEN** the Actor PPE configuration is reviewed
- **THEN** all 7 event names and their USD prices match the PRD specification exactly

#### Scenario: Free tier allows 50 items
- **WHEN** a new user runs the Actor for the first time
- **THEN** they can scrape up to 50 items without being charged
