## ADDED Requirements

### Requirement: Project initialization with Node.js 20 LTS and TypeScript strict mode
The project SHALL have a valid `package.json` with all runtime and dev dependencies, and a `tsconfig.json` configured with strict mode enabled. The project SHALL compile without errors using `npm run build`.

#### Scenario: Successful project compilation
- **WHEN** running `npm run build`
- **THEN** TypeScript compiles all `src/` files to `dist/` without errors

#### Scenario: Package.json has all required dependencies
- **WHEN** inspecting `package.json`
- **THEN** runtime dependencies include: apify, crawlee, got-scraping, cheerio
- **THEN** dev dependencies include: typescript, @types/node, vitest

### Requirement: NPM scripts for build, start, and test
The project SHALL define npm scripts: `build` (tsc), `start` (node dist/main.js), `test` (vitest run), `test:watch` (vitest).

#### Scenario: All npm scripts are executable
- **WHEN** running `npm run build && npm run test`
- **THEN** both commands complete successfully

### Requirement: Folder structure matches architecture specification
The project SHALL create the full directory structure: `src/config/`, `src/clients/`, `src/scrapers/`, `src/parsers/`, `src/extractors/`, `src/processors/`, `src/utils/`, `src/types/`, `.actor/`, `tests/fixtures/`, `tests/unit/`.

#### Scenario: All source directories exist
- **WHEN** checking the file system after setup
- **THEN** all directories defined in the architecture doc exist under `src/`
