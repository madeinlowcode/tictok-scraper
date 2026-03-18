# Arquitetura Técnica — TikTok Scraper Pro

## Guia de Implementação para Claude Code

**Versão:** 1.0
**Data:** 18/03/2026
**Fase:** MVP (Apify Store)

---

## 1. Princípio Fundamental

Mesmo padrão do YouTube Scraper Pro:
- **Core (independente):** clients/, parsers/, extractors/, processors/, utils/ → NÃO importam nada do Apify SDK
- **Wrapper (Apify):** main.ts usa Apify SDK para orquestrar crawling, proxies e storage

---

## 2. Clients

### 2.1 TikTok Web Client (`src/clients/tiktok-web.ts`)

Responsável por buscar páginas HTML e extrair dados embedados. NÃO usa Apify SDK.

```typescript
interface TikTokWebClient {
  /**
   * Busca página de perfil e extrai dados embedados
   * GET https://www.tiktok.com/@{username}
   */
  fetchProfile(username: string): Promise<RawProfileData>;

  /**
   * Busca página de vídeo e extrai dados embedados
   * GET https://www.tiktok.com/@{username}/video/{videoId}
   */
  fetchVideo(videoUrl: string): Promise<RawVideoData>;

  /**
   * Busca página de hashtag e extrai dados embedados
   * GET https://www.tiktok.com/tag/{hashtag}
   */
  fetchHashtag(hashtag: string): Promise<RawHashtagData>;

  /**
   * Busca página de som/música
   * GET https://www.tiktok.com/music/{slug}-{musicId}
   */
  fetchSound(musicUrl: string): Promise<RawSoundData>;
}
```

**Headers obrigatórios:**

```typescript
const WEB_HEADERS = {
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
  'Accept-Encoding': 'gzip, deflate, br',
  'User-Agent': '... (rotacionar entre user agents reais)',
  'Referer': 'https://www.tiktok.com/',
  'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
};
```

**Como extrair dados embedados:**

Toda página do TikTok contém um `<script>` com JSON embedado:

```typescript
// O JSON está dentro de:
// <script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application/json">
//   { "__DEFAULT_SCOPE__": { ... } }
// </script>

// Para vídeos:
// data.__DEFAULT_SCOPE__["webapp.video-detail"].itemInfo.itemStruct

// Para perfis:
// data.__DEFAULT_SCOPE__["webapp.user-detail"].userInfo

// Para hashtags:
// data.__DEFAULT_SCOPE__["webapp.hashtag-detail"]
```

### 2.2 TikTok API Client (`src/clients/tiktok-api.ts`)

Responsável por chamar APIs internas do TikTok para paginação e dados adicionais.

```typescript
interface TikTokApiClient {
  /**
   * Lista vídeos de um perfil com paginação
   * GET /api/post/item_list/?aid=1988&secUid={secUid}&cursor={cursor}&count=30
   */
  getProfileVideos(secUid: string, cursor?: string): Promise<RawVideoListResponse>;

  /**
   * Lista comentários de um vídeo
   * GET /api/comment/list/?aid=1988&aweme_id={videoId}&cursor={cursor}&count=50
   */
  getComments(videoId: string, cursor?: string): Promise<RawCommentListResponse>;

  /**
   * Busca geral
   * GET /api/search/general/full/?aid=1988&keyword={keyword}&offset={offset}
   */
  search(keyword: string, offset?: number): Promise<RawSearchResponse>;

  /**
   * Trending hashtags via Creative Center
   * GET https://ads.tiktok.com/creative_radar_api/v1/popular_trend/hashtag/list
   */
  getTrendingHashtags(region: string, period?: string): Promise<RawTrendingResponse>;

  /**
   * Sons populares via Creative Center
   * GET https://ads.tiktok.com/creative_radar_api/v1/popular_trend/sound/list
   */
  getPopularSounds(region: string): Promise<RawSoundListResponse>;
}
```

**Parâmetros obrigatórios para APIs internas:**

```typescript
const API_BASE_PARAMS = {
  aid: '1988',
  app_language: 'pt-BR',
  app_name: 'tiktok_web',
  browser_language: 'pt-BR',
  browser_name: 'Mozilla',
  browser_platform: 'Win32',
  channel: 'tiktok_web',
  device_platform: 'web_pc',
  region: 'BR',              // DIFERENCIAL BR
};

// Creative Center API (trending)
const CREATIVE_CENTER_BASE = 'https://ads.tiktok.com/creative_radar_api/v1/popular_trend';
```

---

## 3. Hydration Extractor

### 3.1 Arquivo: `src/extractors/hydration-extractor.ts`

Componente central que extrai o JSON embedado do HTML do TikTok.

```typescript
/**
 * Extrai o JSON de __UNIVERSAL_DATA_FOR_REHYDRATION__ do HTML
 * 
 * @param html - HTML completo da página TikTok
 * @returns Objeto JSON parseado do scope __DEFAULT_SCOPE__
 * @throws Error se o script tag não for encontrado
 */
function extractHydrationData(html: string): Record<string, any> {
  // 1. Usar cheerio para encontrar o script tag
  // 2. Extrair o conteúdo JSON
  // 3. Parsear e retornar __DEFAULT_SCOPE__
  // 4. Tratar caso onde a estrutura mudou (fallback)
}

/**
 * Extrai dados de vídeo do hydration data
 */
function extractVideoFromHydration(data: Record<string, any>): RawVideoData {
  // Navega: data["webapp.video-detail"].itemInfo.itemStruct
}

/**
 * Extrai dados de perfil do hydration data
 */
function extractProfileFromHydration(data: Record<string, any>): RawProfileData {
  // Navega: data["webapp.user-detail"].userInfo
}

/**
 * Extrai dados de hashtag do hydration data
 */
function extractHashtagFromHydration(data: Record<string, any>): RawHashtagData {
  // Navega: data["webapp.hashtag-detail"]
}
```

---

## 4. Parsers

### 4.1 Princípio

Funções puras. Recebem JSON bruto, retornam tipos estruturados. Sem side effects.

### 4.2 video-parser.ts

Campos extraídos do TikTok video data:

```
itemStruct → {
  id              → videoId
  desc            → description
  createTime      → timestamp UNIX
  video.duration  → duração em segundos
  video.cover     → URL da capa
  video.playAddr  → URL de reprodução
  stats.diggCount → likes
  stats.shareCount → shares
  stats.commentCount → comments
  stats.playCount → plays
  stats.collectCount → saves/favorites
  author.uniqueId → username
  author.nickname → nome de exibição
  author.verified → verificado
  music.id        → musicId
  music.title     → nome da música
  music.authorName → artista
  challenges[]    → hashtags
  isAd            → é anúncio
  locationCreated → país de criação
}
```

### 4.3 profile-parser.ts

Campos extraídos:

```
userInfo.user → {
  id           → userId
  secUid       → secUid (necessário para APIs de paginação)
  uniqueId     → username
  nickname     → nome de exibição
  signature    → bio
  verified     → verificado
  privateAccount → conta privada
  avatarLarger → avatar URL
  bioLink.link → link da bio
  region       → país
}

userInfo.stats → {
  followerCount  → seguidores
  followingCount → seguindo
  heartCount     → total de likes recebidos
  videoCount     → número de vídeos
}
```

### 4.4 Funções utilitárias de parsing

```typescript
/**
 * Converte timestamp UNIX (segundos) para ISO 8601
 */
function unixToISO(timestamp: number): string;

/**
 * Resolve URLs curtas (vm.tiktok.com) para URL completa
 */
function resolveShortUrl(shortUrl: string): Promise<string>;

/**
 * Extrai videoId de diferentes formatos de URL TikTok
 * Suporta: tiktok.com/@user/video/123, vm.tiktok.com/abc, etc.
 */
function extractVideoId(url: string): string;

/**
 * Extrai username de URL de perfil
 * Suporta: tiktok.com/@username, URLs com parâmetros
 */
function extractUsername(url: string): string;

/**
 * Paginação via cursor (diferente do YouTube que usa continuationToken)
 * TikTok usa cursor numérico + hasMore boolean
 */
function extractCursor(response: any): { cursor: string; hasMore: boolean };
```

---

## 5. Scrapers

### 5.1 profile-scraper.ts

```typescript
async function scrapeProfile(
  webClient: TikTokWebClient,
  apiClient: TikTokApiClient,
  identifier: string, // URL, @handle ou secUid
  options?: { maxVideos?: number; includeEngagement?: boolean }
): Promise<ProfileOutput> {
  // 1. Resolve identifier para username
  // 2. Fetch página do perfil (Camada 1 - dados embedados)
  // 3. Extrair hydration data → parseProfile
  // 4. Se maxVideos > vídeos iniciais → chamar API /api/post/item_list/ (Camada 2)
  // 5. Se includeEngagement → calcular métricas derivadas
  // 6. Retornar ProfileOutput
}
```

### 5.2 video-scraper.ts

```typescript
async function scrapeVideo(
  webClient: TikTokWebClient,
  videoIdentifier: string, // URL ou videoId
): Promise<VideoOutput> {
  // 1. Resolve URL curta se necessário
  // 2. Fetch página do vídeo (Camada 1)
  // 3. Extrair hydration data → parseVideo
  // 4. Retornar VideoOutput
}
```

### 5.3 comment-scraper.ts

```typescript
async function scrapeComments(
  apiClient: TikTokApiClient,
  videoId: string,
  options?: { maxComments?: number }
): Promise<CommentOutput[]> {
  // 1. Chamar /api/comment/list/ com paginação via cursor
  // 2. Loop até maxComments ou hasMore === false
  // 3. Parsear cada comentário
  // 4. Retornar array de CommentOutput
}
```

### 5.4 hashtag-scraper.ts

```typescript
async function scrapeHashtag(
  webClient: TikTokWebClient,
  apiClient: TikTokApiClient,
  hashtag: string,
  options?: { maxVideos?: number }
): Promise<HashtagOutput> {
  // 1. Fetch página /tag/{hashtag} (Camada 1)
  // 2. Extrair hydration data → parseHashtag + vídeos iniciais
  // 3. Se maxVideos > vídeos iniciais → paginação via API
  // 4. Retornar HashtagOutput
}
```

### 5.5 search-scraper.ts

```typescript
async function scrapeSearch(
  apiClient: TikTokApiClient,
  keyword: string,
  options?: {
    maxResults?: number;
    sortBy?: 'relevance' | 'likes' | 'date';
    publishedAfter?: string;
    region?: string;
  }
): Promise<VideoOutput[]> {
  // 1. Chamar /api/search/general/full/ com paginação via offset
  // 2. Loop até maxResults
  // 3. Parsear resultados
  // 4. Retornar array de VideoOutput
}
```

### 5.6 trending-scraper.ts

```typescript
async function scrapeTrending(
  apiClient: TikTokApiClient,
  options?: {
    region?: string; // default: 'BR'
    category?: string;
    period?: '7d' | '30d' | '120d';
    maxItems?: number;
  }
): Promise<TrendingOutput> {
  // 1. Chamar Creative Center API (ads.tiktok.com)
  //    Endpoint: /creative_radar_api/v1/popular_trend/hashtag/list
  // 2. Filtrar por região BR
  // 3. Parsear trending items com rank, views, chart
  // 4. Retornar TrendingOutput
}
```

### 5.7 sound-scraper.ts

```typescript
async function scrapeSound(
  webClient: TikTokWebClient,
  apiClient: TikTokApiClient,
  soundIdentifier: string, // URL ou musicId
  options?: { maxVideos?: number }
): Promise<SoundOutput> {
  // 1. Se URL → fetch página do som (Camada 1)
  // 2. Se busca → chamar Creative Center API de sons populares
  // 3. Extrair dados do som + vídeos que usam
  // 4. Retornar SoundOutput
}
```

---

## 6. Processors

### 6.1 engagement-calculator.ts

Diferencial competitivo — calcula métricas que nenhum concorrente entrega:

```typescript
interface EngagementMetrics {
  avgViews: number;
  avgLikes: number;
  avgComments: number;
  avgShares: number;
  engagementRate: number;    // (likes+comments+shares) / views * 100
  likeToViewRatio: number;   // likes / views * 100
  commentToViewRatio: number;
  shareToViewRatio: number;
  estimatedReach: number;    // baseado em followers vs views
}

function calculateEngagement(
  profile: ProfileOutput,
  videos: VideoOutput[]
): EngagementMetrics;
```

### 6.2 data-cleaner.ts

- Remove campos undefined/null
- Normaliza timestamps UNIX para ISO 8601
- Limpa URLs (remove tracking params)
- Trata campos que o TikTok retorna como 0 quando na verdade estão ocultos

---

## 7. Utils Específicos do TikTok

### 7.1 signature-generator.ts

O TikTok usa parâmetros dinâmicos nas APIs internas (msToken, X-Bogus, _signature). Estratégia:

- **Abordagem primária:** Usar got-scraping que já lida com TLS fingerprinting
- **Fallback:** Se APIs internas exigirem assinatura, usar dados embedados (Camada 1)
- **Último recurso:** PlaywrightCrawler que gera tokens naturalmente

### 7.2 cookie-manager.ts

Gerencia cookies de sessão para manter consistência entre requests:

```typescript
interface CookieManager {
  getSessionCookies(): Promise<Record<string, string>>;
  refreshCookies(): Promise<void>;
  getCookieHeader(): string;
}
```

### 7.3 url-resolver.ts

Resolve diferentes formatos de URL do TikTok:

```typescript
// Formatos suportados:
// https://www.tiktok.com/@username/video/1234567890
// https://vm.tiktok.com/ZMabc123/
// https://www.tiktok.com/@username
// https://www.tiktok.com/tag/hashtag
// https://www.tiktok.com/music/song-name-1234567890
// tiktok.com/@username (sem https)
```

---

## 8. Apify Actor Wrapper

### 8.1 main.ts

```typescript
import { Actor } from 'apify';
import { BasicCrawler, PlaywrightCrawler } from 'crawlee';

// Core (independente - NÃO usa Apify)
import { TikTokWebClient } from './clients/tiktok-web';
import { TikTokApiClient } from './clients/tiktok-api';
import { scrapeProfile } from './scrapers/profile-scraper';
import { scrapeVideo } from './scrapers/video-scraper';
// ... demais scrapers

await Actor.init();
const input = await Actor.getInput();

const proxyConfiguration = await Actor.createProxyConfiguration({
  groups: ['RESIDENTIAL'],
});

const webClient = new TikTokWebClient({ proxyUrl: ... });
const apiClient = new TikTokApiClient({ proxyUrl: ... });

// Roteia baseado no tipo de input
// URLs de perfil → profile-scraper
// URLs de vídeo → video-scraper
// Hashtags → hashtag-scraper
// Keywords → search-scraper
// "trending" → trending-scraper
// URLs de som → sound-scraper

// Salva resultados
await Actor.pushData(results);

// Cobra por evento
await Actor.charge({ eventName: 'item-scraped', count: results.length });

await Actor.exit();
```

### 8.2 Lógica de roteamento

```
Para cada item no input:
  Se URL contém "/@" + "/video/" → Video Scraper
  Se URL contém "/@" (sem /video/) → Profile Scraper
  Se URL contém "/tag/" → Hashtag Scraper
  Se URL contém "/music/" → Sound Scraper
  Se URL contém "vm.tiktok.com" → Resolver URL primeiro, depois rotear
  Se é keyword pura → Search Scraper
  Se input.trending === true → Trending Scraper
```

---

## 9. Testes

### 9.1 Fixtures

Capturar responses reais e salvar em `tests/fixtures/`:

```
tests/fixtures/
├── hydration-profile.json     # HTML parseado de /@username
├── hydration-video.json       # HTML parseado de /video/123
├── hydration-hashtag.json     # HTML parseado de /tag/abc
├── api-post-item-list.json    # Response de /api/post/item_list/
├── api-comment-list.json      # Response de /api/comment/list/
├── api-search.json            # Response de /api/search/
└── creative-center-trending.json # Response de trending API
```

### 9.2 Testes unitários

```
tests/unit/
├── extractors/
│   └── hydration-extractor.test.ts
├── parsers/
│   ├── profile-parser.test.ts
│   ├── video-parser.test.ts
│   ├── comment-parser.test.ts
│   └── hashtag-parser.test.ts
├── processors/
│   └── engagement-calculator.test.ts
└── utils/
    ├── url-resolver.test.ts
    └── retry-handler.test.ts
```

---

## 10. Convenções de Código

Mesmas do YouTube Scraper Pro:
- Arquivos: kebab-case
- Classes/Interfaces: PascalCase
- Funções: camelCase
- Constantes: UPPER_SNAKE_CASE
- Core NÃO importa Apify SDK
- Erros customizados: TikTokError, ProfileNotFoundError, VideoNotFoundError, RateLimitError
