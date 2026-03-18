# CLAUDE.md — Contexto do Projeto TikTok Scraper Pro

## Este arquivo é o guia principal para o Claude Code

---

## Projeto: TikTok Scraper Pro (TT-Scraper)

### O que é
Scraper unificado de dados públicos do TikTok (7 módulos em 1 Actor). Usa dados embedados no HTML + APIs internas + fallback browser. Publicado no Apify Store com Pay per Event.

### Stack
- **TypeScript** (Node.js 20 LTS)
- **Crawlee** (BasicCrawler + PlaywrightCrawler) + **Apify SDK**
- **got-scraping** — HTTP client com fingerprint TLS
- **cheerio** — HTML parsing para extrair hydration data
- **Playwright** — browser headless (fallback)
- **Vitest** — testes

### Fase atual: MVP Completo (todos os 7 módulos)

---

## Regras Fundamentais

1. **O core (clients/, parsers/, extractors/, processors/, utils/) NÃO importa nada do Apify SDK**
2. **Apenas main.ts usa Apify SDK** (Actor, BasicCrawler, PlaywrightCrawler, ProxyConfiguration)
3. **3 camadas de extração:** Dados embedados (Camada 1) → APIs internas (Camada 2) → Browser headless (Camada 3)
4. **Priorizar Camada 1** (dados embedados) — mais rápida e estável
5. **TypeScript strict mode** — interfaces para tudo, sem `any` desnecessário
6. **Funções puras nos parsers** — sem side effects
7. **Retry com backoff exponencial** em toda chamada HTTP
8. **Region default: BR** — diferencial do produto

---

## Dados Embedados do TikTok (Camada 1)

Toda página TikTok contém um `<script>` com JSON:

```html
<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application/json">
  { "__DEFAULT_SCOPE__": { ... } }
</script>
```

### Caminhos dos dados no JSON:

| Tipo | Caminho no JSON |
|------|----------------|
| Vídeo | `__DEFAULT_SCOPE__["webapp.video-detail"].itemInfo.itemStruct` |
| Perfil | `__DEFAULT_SCOPE__["webapp.user-detail"].userInfo` |
| Hashtag | `__DEFAULT_SCOPE__["webapp.hashtag-detail"]` |

---

## APIs Internas do TikTok (Camada 2)

| Endpoint | Uso | Params principais |
|----------|-----|-------------------|
| `/api/post/item_list/` | Vídeos de perfil (paginação) | secUid, cursor, count |
| `/api/comment/list/` | Comentários de vídeo | aweme_id, cursor, count |
| `/api/search/general/full/` | Busca por keywords | keyword, offset |
| Creative Center API | Trending e sons populares | region, period |

### Params base para APIs internas:
```json
{ "aid": "1988", "app_language": "pt-BR", "region": "BR", "device_platform": "web_pc" }
```

### Paginação:
TikTok usa **cursor** (numérico) + **hasMore** (boolean), diferente do YouTube que usa continuationToken.

---

## Módulos

| Módulo | Input | Camada principal |
|--------|-------|-----------------|
| Profile Scraper | URL/@handle | Camada 1 + Camada 2 (paginação vídeos) |
| Video Scraper | URL/videoId | Camada 1 |
| Comment Scraper | videoId + max | Camada 2 |
| Hashtag Scraper | hashtag name | Camada 1 + Camada 2 |
| Search Scraper | keyword | Camada 2 |
| Trending Scraper | region (BR) | Creative Center API |
| Sound Scraper | URL/musicId | Camada 1 + Creative Center |

---

## Estrutura de Pastas

```
src/
├── main.ts                    # ÚNICO com Apify SDK
├── config/constants.ts
├── clients/
│   ├── tiktok-web.ts          # HTTP + hydration (Camada 1)
│   └── tiktok-api.ts          # APIs internas (Camada 2)
├── scrapers/
│   ├── profile-scraper.ts
│   ├── video-scraper.ts
│   ├── comment-scraper.ts
│   ├── hashtag-scraper.ts
│   ├── search-scraper.ts
│   ├── trending-scraper.ts
│   └── sound-scraper.ts
├── parsers/
│   ├── profile-parser.ts
│   ├── video-parser.ts
│   ├── comment-parser.ts
│   ├── hashtag-parser.ts
│   ├── search-parser.ts
│   └── sound-parser.ts
├── extractors/
│   └── hydration-extractor.ts  # Extrai JSON do <script>
├── processors/
│   ├── data-cleaner.ts
│   └── engagement-calculator.ts
├── utils/
│   ├── retry-handler.ts
│   ├── rate-limiter.ts
│   ├── signature-generator.ts
│   ├── cookie-manager.ts
│   └── url-resolver.ts
└── types/index.ts
```

---

## Documentação Detalhada

- `docs/01-PRD-TikTok-Scraper.md` — Produto, mercado, precificação, concorrência
- `docs/02-ARCHITECTURE-Technical-Guide.md` — Implementação detalhada de cada componente
- `docs/03-SPRINT-PLAN-MVP.md` — Tarefas em ordem de execução, 4 sprints

---

## Comandos

```bash
npm run build          # Compila TypeScript
npm run start          # Roda localmente
npm run test           # Testes
apify run              # Simula Apify
apify push             # Deploy para Apify Store
```
