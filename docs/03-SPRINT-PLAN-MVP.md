# Sprint Plan — TikTok Scraper Pro MVP

## Guia de Execução para Claude Code

**Versão:** 1.0
**Data:** 18/03/2026
**Objetivo:** Construir e deployar o TikTok Scraper Pro completo (7 módulos) no Apify Store

---

## Visão Geral do MVP

Diferente do YouTube (que teve MVP reduzido), aqui o MVP já inclui TODOS os módulos porque o diferencial é ser unificado.

### Módulos do MVP

1. Profile Scraper
2. Video Scraper
3. Comment Scraper
4. Hashtag Scraper
5. Search Scraper
6. Trending Scraper (BR)
7. Sound Scraper
8. Engagement Calculator (processor)

---

## Sprint 1 — Fundação + Camada 1 (Dados Embedados)

**Duração:** 1 semana
**Objetivo:** Setup + TikTok Web Client + Hydration Extractor + Video/Profile Scrapers

### Tarefas

#### 1.1 Setup do projeto

```bash
mkdir tiktok-scraper-pro && cd tiktok-scraper-pro
npm init -y
npm install apify crawlee got-scraping cheerio
npm install -D typescript @types/node vitest
npx tsc --init
```

Configurar: tsconfig.json, .eslintrc.json, .prettierrc, package.json scripts.

#### 1.2 Estrutura de pastas

Criar toda a estrutura conforme arquitetura (src/, .actor/, tests/, docs/).

#### 1.3 Types (src/types/index.ts)

Definir todas as interfaces:
- ProfileOutput, VideoOutput, CommentOutput, HashtagOutput, TrendingOutput, SoundOutput
- EngagementMetrics
- RawProfileData, RawVideoData, RawHashtagData (tipos dos dados brutos)
- ScraperInput (input do Actor)

#### 1.4 Constants (src/config/constants.ts)

Definir:
- WEB_HEADERS (headers para requests HTTP)
- API_BASE_PARAMS (params das APIs internas)
- CREATIVE_CENTER_BASE (URL da API de trending)
- SUPPORTED_REGIONS, SUPPORTED_CATEGORIES
- RETRY_CONFIG, RATE_LIMIT_CONFIG

#### 1.5 Hydration Extractor (src/extractors/hydration-extractor.ts)

Implementar:
- `extractHydrationData(html)` → extrai JSON do `<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__">`
- `extractVideoFromHydration(data)` → navega até webapp.video-detail
- `extractProfileFromHydration(data)` → navega até webapp.user-detail
- `extractHashtagFromHydration(data)` → navega até webapp.hashtag-detail

**Este é o componente mais crítico.** Testar com HTML real de páginas TikTok.

#### 1.6 TikTok Web Client (src/clients/tiktok-web.ts)

Implementar:
- Classe TikTokWebClient
- Construtor com config (proxyUrl, headers)
- `fetchProfile(username)` → GET + hydration extractor
- `fetchVideo(videoUrl)` → GET + hydration extractor
- `fetchHashtag(hashtag)` → GET + hydration extractor
- `fetchSound(musicUrl)` → GET + hydration extractor
- Método privado `fetchPage(url)` com got-scraping + retry

**Importante:** Usar `got-scraping` do Crawlee (já inclui fingerprint TLS realista).

#### 1.7 URL Resolver (src/utils/url-resolver.ts)

Implementar:
- `extractVideoId(url)` — suporta todos os formatos TikTok
- `extractUsername(url)` — extrai @username
- `resolveShortUrl(url)` — resolve vm.tiktok.com → URL completa (follow redirect)
- `detectInputType(input)` — retorna 'profile' | 'video' | 'hashtag' | 'sound' | 'keyword'

#### 1.8 Video Parser + Video Scraper

Implementar:
- `parseVideo(rawData)` → VideoOutput
- `scrapeVideo(webClient, videoIdentifier)` → VideoOutput

#### 1.9 Profile Parser + Profile Scraper (sem paginação)

Implementar:
- `parseProfile(rawData)` → ProfileOutput (sem vídeos extras)
- `scrapeProfile(webClient, apiClient, identifier, options?)` → ProfileOutput
- Versão inicial: só dados embedados, sem paginação de vídeos

#### 1.10 Testes Sprint 1

Capturar fixtures reais (acessar TikTok no browser, salvar HTML e JSONs) e testar parsers.

### Critérios de conclusão Sprint 1

- [ ] Hydration extractor funciona com HTML real do TikTok
- [ ] Video scraper retorna VideoOutput completo
- [ ] Profile scraper retorna ProfileOutput com dados básicos
- [ ] URL resolver lida com todos os formatos de URL
- [ ] Testes unitários dos parsers passando

---

## Sprint 2 — Camada 2 (APIs Internas) + Mais Scrapers

**Duração:** 1 semana
**Objetivo:** API Client + Hashtag/Search/Comment Scrapers

### Tarefas

#### 2.1 TikTok API Client (src/clients/tiktok-api.ts)

Implementar:
- Classe TikTokApiClient
- `getProfileVideos(secUid, cursor?)` → chama /api/post/item_list/
- `getComments(videoId, cursor?)` → chama /api/comment/list/
- `search(keyword, offset?)` → chama /api/search/general/full/
- Método privado `apiRequest(endpoint, params)` com retry + rate limiting
- Cookie manager integrado

**Nota:** As APIs internas do TikTok exigem muitos parâmetros. Começar com o mínimo necessário e ir adicionando conforme erros aparecem.

#### 2.2 Cookie Manager (src/utils/cookie-manager.ts)

Implementar:
- Buscar cookies fazendo GET inicial na homepage do TikTok
- Armazenar e reutilizar cookies na sessão
- Refresh quando cookies expiram

#### 2.3 Profile Scraper — Adicionar paginação

Atualizar profile-scraper para usar TikTok API Client:
- Após dados embedados (Sprint 1), usar /api/post/item_list/ para buscar mais vídeos
- Paginação via cursor até maxVideos

#### 2.4 Comment Parser + Comment Scraper

Implementar:
- `parseComment(rawData)` → CommentOutput
- `scrapeComments(apiClient, videoId, options?)` → CommentOutput[]
- Paginação via cursor

#### 2.5 Hashtag Parser + Hashtag Scraper

Implementar:
- `parseHashtag(rawData)` → HashtagOutput
- `scrapeHashtag(webClient, apiClient, hashtag, options?)` → HashtagOutput
- Dados iniciais via Camada 1 + paginação via Camada 2

#### 2.6 Search Parser + Search Scraper

Implementar:
- `parseSearchResults(rawData)` → VideoOutput[]
- `scrapeSearch(apiClient, keyword, options?)` → VideoOutput[]
- Paginação via offset

#### 2.7 Testes Sprint 2

Fixtures das APIs internas + testes de paginação.

### Critérios de conclusão Sprint 2

- [ ] TikTok API Client funciona com /api/post/item_list/
- [ ] Comments scraper extrai comentários com paginação
- [ ] Hashtag scraper retorna dados + vídeos
- [ ] Search scraper retorna resultados de busca
- [ ] Profile scraper com paginação de vídeos

---

## Sprint 3 — Trending + Sound + Engagement

**Duração:** 1 semana
**Objetivo:** Módulos diferenciadores + processor de engajamento

### Tarefas

#### 3.1 Trending Scraper

Implementar:
- Integração com Creative Center API (ads.tiktok.com)
- `scrapeTrending(apiClient, options?)` → TrendingOutput
- Suporte a 73+ países (default: BR)
- Filtro por categoria (Education, Fashion, Beauty, Tech, etc.)
- Detecção de trending novos (isNew)

#### 3.2 Sound Parser + Sound Scraper

Implementar:
- `parseSound(rawData)` → SoundOutput
- `scrapeSound(webClient, apiClient, soundIdentifier, options?)` → SoundOutput
- Integração com Creative Center para sons populares

#### 3.3 Engagement Calculator (src/processors/engagement-calculator.ts)

Implementar:
- `calculateEngagement(profile, videos)` → EngagementMetrics
- Taxa de engajamento: (likes + comments + shares) / views * 100
- Médias: avgViews, avgLikes, avgComments, avgShares
- Ratios: likeToView, commentToView, shareToView

#### 3.4 Data Cleaner (src/processors/data-cleaner.ts)

Implementar:
- Normalização de todos os outputs
- Tratamento de campos ausentes
- Conversão de timestamps

#### 3.5 Testes Sprint 3

Testes do trending, sound e engagement calculator.

### Critérios de conclusão Sprint 3

- [ ] Trending scraper retorna hashtags populares do Brasil
- [ ] Sound scraper extrai dados de músicas
- [ ] Engagement calculator gera métricas corretas
- [ ] Todos os 7 módulos funcionando individualmente

---

## Sprint 4 — Actor + Deploy

**Duração:** 3-5 dias
**Objetivo:** Integração final + deploy no Apify Store

### Tarefas

#### 4.1 Input Schema (.actor/input_schema.json)

Criar schema completo com campos:
- urls (array de URLs TikTok)
- searchQueries (keywords para busca)
- hashtags (hashtags para scrape)
- profiles (lista de @handles)
- maxResults, maxComments, maxVideos
- region (default: BR)
- includeTrending (boolean)
- includeEngagement (boolean)
- includeComments (boolean)

#### 4.2 Main.ts — Apify Actor

Implementar entry point completo:
- Validação de input
- Criação dos clients (web + api) com proxy configuration
- Roteamento para scrapers corretos
- Push de resultados para Dataset
- Cobrança PPE por tipo de evento
- Error handling graceful
- Logs informativos

#### 4.3 Fallback PlaywrightCrawler

Implementar fallback para quando Camadas 1 e 2 falham:
- PlaywrightCrawler que renderiza a página
- Intercepta XHR requests para capturar dados
- Usado automaticamente quando HTTP falha

#### 4.4 actor.json + Dockerfile

Configuração do Actor e imagem Docker.

#### 4.5 README.md

README completo com:
- Descrição, features, diferencial
- Como usar (passo a passo)
- Exemplos de input/output para cada módulo
- Precificação
- FAQ
- Comparação com concorrentes

#### 4.6 Testes end-to-end

Testar cenários reais:
- Input com URLs de perfis
- Input com URLs de vídeos
- Input com hashtags
- Input com keywords de busca
- Trending BR
- Input misto
- Inputs inválidos

#### 4.7 Deploy no Apify

1. `apify login`
2. `apify push`
3. Testar no Apify Console
4. Configurar monetização PPE:
   - profile-scraped: $0.003
   - video-scraped: $0.002
   - comment-scraped: $0.0003
   - search-result: $0.001
   - trending-item: $0.002
   - hashtag-scraped: $0.003
   - sound-scraped: $0.002
   - Free tier: 50 itens
5. Publicar no Store

### Critérios de conclusão Sprint 4

- [ ] Actor roda localmente com todos os módulos
- [ ] Actor publicado no Apify Store
- [ ] Monetização PPE configurada
- [ ] README completo
- [ ] 5+ runs de teste bem-sucedidos no cloud

---

## Checklist Final do MVP

### Funcionalidades

- [ ] Extrair perfis completos (bio, followers, métricas, vídeos)
- [ ] Extrair vídeos individuais (caption, likes, plays, música, hashtags)
- [ ] Extrair comentários com paginação
- [ ] Buscar por hashtags com vídeos
- [ ] Buscar por keywords
- [ ] Trending Brasil (hashtags e vídeos)
- [ ] Sons/Músicas populares
- [ ] Taxa de engajamento calculada
- [ ] Free tier de 50 itens

### Qualidade

- [ ] Taxa de sucesso > 90%
- [ ] 3 camadas de fallback (embedado → API → browser)
- [ ] Retry com backoff exponencial
- [ ] Rate limiting
- [ ] Core independente do Apify SDK

### Deploy

- [ ] Actor publicado no Apify Store
- [ ] PPE ativo com preços configurados
- [ ] README com exemplos para cada módulo

---

## Comandos

```bash
npm run build              # Compila TypeScript
npm run start              # Roda localmente
npm run test               # Todos os testes
npm run test:unit          # Testes unitários
npm run test:integration   # Testes de integração
apify run                  # Simula Apify localmente
apify push                 # Deploy para Apify Store
```

---

## Notas Importantes

1. **O TikTok muda APIs a cada 4-8 semanas.** Mantenha testes de integração rodando semanalmente para detectar quebras cedo.

2. **Dados embedados (Camada 1) são mais estáveis** que APIs internas (Camada 2). Priorize Camada 1 sempre que possível.

3. **secUid é essencial** para APIs de paginação de perfil. Sempre extrair do hydration data e passar para o TikTok API Client.

4. **Creative Center API (ads.tiktok.com)** é mais estável que as APIs internas do tiktok.com. Use-a como fonte principal para trending e sons.

5. **got-scraping já lida com TLS fingerprinting.** Não precisa implementar fingerprinting manual.

6. **Campos podem estar zerados** — TikTok retorna 0 para alguns campos quando quer ocultar dados. Tratar como null/undefined nesses casos.

7. **O core NÃO importa Apify SDK.** Verificar imports a cada commit. Apenas main.ts usa Actor, BasicCrawler, etc.
