## 1. Setup do Projeto

- [x] 1.1 Criar `package.json` com dependências runtime (apify, crawlee, got-scraping, cheerio) e dev (typescript, @types/node, vitest) e scripts (build, start, test, test:watch)
- [x] 1.2 Criar `tsconfig.json` com strict mode, target ES2022, module NodeNext, outDir dist/
- [x] 1.3 Criar toda a estrutura de diretórios: src/config/, src/clients/, src/scrapers/, src/parsers/, src/extractors/, src/processors/, src/utils/, src/types/, .actor/, tests/fixtures/, tests/unit/

## 2. Sistema de Tipos

- [x] 2.1 Criar `src/types/index.ts` com todas as interfaces de output: ProfileOutput, VideoOutput, CommentOutput, HashtagOutput, TrendingOutput, SoundOutput
- [x] 2.2 Adicionar tipos internos: RawProfileData, RawVideoData, RawHashtagData, RawCommentData, RawSearchResponse, RawSoundData, RawTrendingResponse, RawVideoListResponse, RawCommentListResponse
- [x] 2.3 Adicionar ScraperInput, EngagementMetrics e tipos auxiliares (PaginationResult, ClientConfig)
- [x] 2.4 Criar classes de erro customizadas: TikTokError, ProfileNotFoundError, VideoNotFoundError, RateLimitError, HydrationExtractionError

## 3. Configurações e Constantes

- [x] 3.1 Criar `src/config/constants.ts` com WEB_HEADERS, API_BASE_PARAMS, CREATIVE_CENTER_BASE, SUPPORTED_REGIONS, RETRY_CONFIG, RATE_LIMIT_CONFIG

## 4. Utils Core

- [x] 4.1 Implementar `src/utils/retry-handler.ts` com backoff exponencial, retry em 5xx/429, sem retry em 4xx
- [x] 4.2 Implementar `src/utils/rate-limiter.ts` com controle de frequência de requests configurável
- [x] 4.3 Implementar `src/utils/url-resolver.ts` com extractVideoId, extractUsername, resolveShortUrl, detectInputType
- [x] 4.4 Implementar `src/utils/cookie-manager.ts` com getSessionCookies, refreshCookies, getCookieHeader

## 5. Hydration Extractor

- [x] 5.1 Implementar `src/extractors/hydration-extractor.ts` com extractHydrationData (cheerio + JSON parse)
- [x] 5.2 Adicionar extractVideoFromHydration, extractProfileFromHydration, extractHashtagFromHydration

## 6. HTTP Clients

- [x] 6.1 Implementar `src/clients/tiktok-web.ts` — TikTokWebClient com fetchProfile, fetchVideo, fetchHashtag, fetchSound usando got-scraping + hydration extractor
- [x] 6.2 Implementar `src/clients/tiktok-api.ts` — TikTokApiClient com getProfileVideos, getComments, search, getTrendingHashtags, getPopularSounds com paginação cursor-based

## 7. Parsers

- [x] 7.1 Implementar `src/parsers/video-parser.ts` — parseVideo como função pura (itemStruct → VideoOutput)
- [x] 7.2 Implementar `src/parsers/profile-parser.ts` — parseProfile (userInfo → ProfileOutput)
- [x] 7.3 Implementar `src/parsers/comment-parser.ts` — parseComment (raw → CommentOutput)
- [x] 7.4 Implementar `src/parsers/hashtag-parser.ts` — parseHashtag (raw → HashtagOutput)
- [x] 7.5 Implementar `src/parsers/search-parser.ts` — parseSearchResults (raw[] → VideoOutput[])
- [x] 7.6 Implementar `src/parsers/sound-parser.ts` — parseSound (raw → SoundOutput)

## 8. Processors

- [x] 8.1 Implementar `src/processors/engagement-calculator.ts` — calculateEngagement com todas as métricas derivadas, tratando zero views e lista vazia
- [x] 8.2 Implementar `src/processors/data-cleaner.ts` — cleanData com normalização de timestamps, limpeza de URLs, tratamento de campos zerados/ocultos

## 9. Scrapers

- [x] 9.1 Implementar `src/scrapers/video-scraper.ts` — scrapeVideo (resolve URL + fetch + parse)
- [x] 9.2 Implementar `src/scrapers/profile-scraper.ts` — scrapeProfile com paginação via API e engagement opcional
- [x] 9.3 Implementar `src/scrapers/comment-scraper.ts` — scrapeComments com paginação cursor
- [x] 9.4 Implementar `src/scrapers/hashtag-scraper.ts` — scrapeHashtag (Layer 1 + Layer 2 paginação)
- [x] 9.5 Implementar `src/scrapers/search-scraper.ts` — scrapeSearch com paginação offset
- [x] 9.6 Implementar `src/scrapers/trending-scraper.ts` — scrapeTrending via Creative Center API
- [x] 9.7 Implementar `src/scrapers/sound-scraper.ts` — scrapeSound (Layer 1 + Creative Center)

## 10. Integração Apify Actor

- [x] 10.1 Criar `src/main.ts` — entry point com Actor.init, input routing, proxy config, clients, push data, charge PPE, error handling graceful
- [x] 10.2 Criar `.actor/actor.json` com metadados do Actor
- [x] 10.3 Criar `.actor/input_schema.json` com JSON Schema completo para todos os campos de input
- [x] 10.4 Criar `Dockerfile` para deployment no Apify

## 11. Testes

- [x] 11.1 Criar configuração Vitest (vitest.config.ts)
- [x] 11.2 Criar fixtures em `tests/fixtures/` com dados JSON representativos do TikTok
- [x] 11.3 Implementar testes do hydration extractor (HTML válido, script ausente, JSON malformado)
- [x] 11.4 Implementar testes dos parsers (video, profile, comment)
- [x] 11.5 Implementar testes do engagement calculator (caso normal, zero views, lista vazia)
- [x] 11.6 Implementar testes do URL resolver (todos os formatos de URL)
- [x] 11.7 Verificar que o projeto compila sem erros (`npm run build`) e testes passam (`npm run test`)
