# PRD — TikTok Scraper Pro (TT-Scraper)

## Product Requirements Document

**Versão:** 1.0
**Data:** 18/03/2026
**Status:** Planejamento

---

## 1. Visão Geral do Produto

### 1.1 O que é

TikTok Scraper Pro é uma ferramenta de extração de dados públicos do TikTok, publicada como Actor no Apify Store com modelo Pay per Event. Core independente reutilizável para futura migração à infraestrutura própria (Contabo).

### 1.2 Problema que resolve

- API oficial do TikTok requer afiliação acadêmica para pesquisa, uso comercial negado
- Scrapers existentes no Apify cobram $5/1.000 resultados (caro para público BR)
- Nenhum concorrente oferece foco em trending Brasil e métricas de engajamento calculadas
- TikTok muda APIs internas a cada 4-8 semanas, dificultando scrapers DIY
- Clockworks domina o nicho com 125k+ usuários, mas fragmenta em muitos Actors separados

### 1.3 Público-alvo

| Persona | Necessidade | Como usa |
|---------|-------------|----------|
| Agências de marketing BR | Monitorar trending, analisar concorrentes | Busca hashtags, trending BR, métricas |
| Criadores de conteúdo | Descobrir trends, sons virais, analisar engajamento | Perfis, hashtags, sons populares |
| Marcas / E-commerce | Monitorar menções, análise de sentimento | Comentários, busca por keywords |
| Desenvolvedores no-code | Integrar dados TikTok em automações n8n/Make | API via Apify |
| Pesquisadores | Análise de tendências culturais | Trending, hashtags, volume |

### 1.4 Proposta de valor

- **Scraper unificado** — 7 módulos em um único Actor (concorrente clockworks fragmenta em 8+ Actors separados)
- **Foco Brasil** — Trending BR, resultados regionalizados com gl:BR
- **Métricas derivadas** — Taxa de engajamento calculada automaticamente
- **Mais barato** — 40-60% mais barato que o líder (clockworks: $5/mil)
- **Core independente** — Mesmo código roda no Apify ou em infra própria

---

## 2. Análise da Concorrência

### 2.1 Concorrentes no Apify Store

| Concorrente | Usuários | Modelo | Preço/1.000 | Pontos fracos |
|-------------|----------|--------|-------------|---------------|
| TikTok Data Extractor (clockworks) | 125.000+ | PPR | $5.00 | Universal mas genérico, sem métricas derivadas |
| TikTok Profile Scraper (clockworks) | — | PPE | Variável | Só perfis, precisa outro Actor para vídeos |
| TikTok Comments Scraper (clockworks) | — | PPE | Variável | Só comentários |
| TikTok Hashtag Scraper (clockworks) | — | PPE | Variável | Só hashtags |
| TikTok Scraper Ultimate (novi) | — | PPE | Variável | Sem paginação, só dados iniciais |
| TikTok Trends (data_xplorer) | — | PPE | Variável | Só trending Creative Center |

**Oportunidade:** Clockworks é dominante mas fragmenta em 8+ Actors. O usuário precisa usar vários Actors separados para ter dados completos. Nosso produto unifica tudo.

### 2.2 Precificação — Apify Store (Pay per Event)

| Evento | Nosso preço | Clockworks | Diferença |
|--------|-------------|------------|-----------|
| Perfil completo | $0.003 | $0.005 | -40% |
| Vídeo (metadados) | $0.002 | $0.005 | -60% |
| Comentário | $0.0003 | Variável | Competitivo |
| Resultado de busca | $0.001 | $0.005 | -80% |
| Trending item | $0.002 | Variável | Competitivo |
| Hashtag (dados + vídeos) | $0.003 | $0.005 | -40% |
| Som/Música | $0.002 | Variável | Competitivo |

- **Free tier:** 50 itens grátis por run
- **Posicionamento:** Mais barato + mais completo em um único Actor

### 2.3 Precificação — Infra Própria (Fase 2 — Futura)

Mesma estrutura do YouTube Scraper Pro:

| Plano | Preço | Requisições/mês |
|-------|-------|-----------------|
| Starter | R$ 47/mês | 2.000 |
| Pro | R$ 97/mês | 10.000 |
| Business | R$ 247/mês | 50.000 |

---

## 3. Arquitetura Técnica

### 3.1 Stack

| Componente | Tecnologia | Justificativa |
|------------|------------|---------------|
| Linguagem | TypeScript (Node.js 20 LTS) | Mesma stack do YouTube Scraper, nativo Apify SDK |
| Framework Apify | Crawlee (BasicCrawler + PlaywrightCrawler) | HTTP puro + browser quando necessário |
| HTTP Client | got-scraping (via Crawlee) | Fingerprint TLS realista integrado |
| Browser | Playwright (via Crawlee) | Para paginação e comentários quando API falha |
| HTML Parsing | cheerio | Extrair dados embedados do HTML |
| JSON Navigation | jmespath | Navegar JSONs complexos do TikTok |
| Testes | Vitest | Rápido, TypeScript nativo |
| Linting | ESLint + Prettier | Padronização |

### 3.2 Abordagem Híbrida (diferença do YouTube)

O TikTok exige uma abordagem em 3 camadas:

```
Camada 1 — Dados Embedados (mais rápido, mais estável)
├── GET na página HTML do TikTok
├── Extrair JSON do <script id="__UNIVERSAL_DATA_FOR_REHYDRATION__">
├── Parsear dados de perfil, vídeo, hashtag
└── Funciona para: perfis, vídeos individuais, hashtags

Camada 2 — APIs Internas (para paginação)
├── GET nas APIs como /api/post/item_list/, /api/comment/list/
├── Requer parâmetros dinâmicos (msToken, X-Bogus)
├── Paginação via cursor
└── Funciona para: mais vídeos de perfil, comentários, busca

Camada 3 — Browser Headless (fallback)
├── PlaywrightCrawler renderiza a página completa
├── Intercepta XHR requests para capturar dados
├── Mais lento e consome mais recursos
└── Usado quando: Camadas 1 e 2 falham
```

### 3.3 Endpoints do TikTok mapeados

```
DADOS EMBEDADOS (HTTP GET + parse HTML):
├── /@{username}              → Perfil + vídeos recentes
├── /video/{videoId}          → Dados completos do vídeo  
├── /tag/{hashtag}            → Dados da hashtag + vídeos

APIs INTERNAS (HTTP GET com params dinâmicos):
├── /api/post/item_list/      → Lista de vídeos de perfil (paginação)
├── /api/comment/list/        → Comentários de um vídeo
├── /api/search/general/full/ → Busca geral
├── /api/recommend/item_list/ → Trending/recomendados

FONTES COMPLEMENTARES:
├── ads.tiktok.com/business/creativecenter/inspiration/popular/music/   → Sons populares
├── ads.tiktok.com/business/creativecenter/inspiration/popular/hashtag/ → Hashtags trending
└── TikTok Creative Center API                                          → Trending por país
```

### 3.4 Estrutura de pastas

```
tiktok-scraper-pro/
├── src/
│   ├── main.ts                    # Apify Actor entry point
│   ├── config/
│   │   └── constants.ts           # URLs, headers, endpoints
│   ├── clients/
│   │   ├── tiktok-web.ts          # Client HTTP (dados embedados)
│   │   └── tiktok-api.ts          # Client APIs internas
│   ├── scrapers/
│   │   ├── profile-scraper.ts     # Perfis/Canais
│   │   ├── video-scraper.ts       # Vídeos individuais
│   │   ├── comment-scraper.ts     # Comentários
│   │   ├── hashtag-scraper.ts     # Hashtags
│   │   ├── search-scraper.ts      # Busca por keywords
│   │   ├── trending-scraper.ts    # Trending por região
│   │   └── sound-scraper.ts       # Sons/Músicas
│   ├── parsers/
│   │   ├── profile-parser.ts
│   │   ├── video-parser.ts
│   │   ├── comment-parser.ts
│   │   ├── hashtag-parser.ts
│   │   ├── search-parser.ts
│   │   └── sound-parser.ts
│   ├── extractors/
│   │   └── hydration-extractor.ts # Extrai JSON do __UNIVERSAL_DATA_FOR_REHYDRATION__
│   ├── processors/
│   │   ├── data-cleaner.ts
│   │   └── engagement-calculator.ts
│   ├── utils/
│   │   ├── retry-handler.ts
│   │   ├── rate-limiter.ts
│   │   ├── signature-generator.ts
│   │   ├── cookie-manager.ts
│   │   └── url-resolver.ts
│   └── types/
│       └── index.ts
├── .actor/
│   ├── actor.json
│   └── input_schema.json
├── tests/
├── docs/
├── CLAUDE.md
├── package.json
├── tsconfig.json
├── Dockerfile
└── README.md
```

---

## 4. Funcionalidades (Módulos)

### 4.1 Profile Scraper
- **Input:** URL do perfil, @handle ou secUid
- **Output:** Bio, followers, following, likes, vídeo count, avatar, links, verificação
- **Método:** Camada 1 (dados embedados)
- **MVP:** SIM

### 4.2 Video Scraper
- **Input:** URL do vídeo ou video ID
- **Output:** Caption, likes, comments count, shares, plays, duração, cover, música, hashtags, autor
- **Método:** Camada 1 (dados embedados)
- **MVP:** SIM

### 4.3 Comment Scraper
- **Input:** URL do vídeo + maxComments
- **Output:** Texto, autor, likes, respostas, timestamp
- **Método:** Camada 2 (API /api/comment/list/) com fallback Camada 3
- **MVP:** SIM

### 4.4 Hashtag Scraper
- **Input:** Nome da hashtag
- **Output:** View count, vídeo count + lista de vídeos top com metadados
- **Método:** Camada 1 (dados embedados) + Camada 2 (paginação)
- **MVP:** SIM

### 4.5 Search Scraper
- **Input:** Keywords + filtros (região, data, tipo)
- **Output:** Lista de vídeos dos resultados de busca
- **Método:** Camada 2 (API /api/search/) com fallback Camada 3
- **MVP:** SIM

### 4.6 Trending Scraper
- **Input:** Região (default: BR) + categoria
- **Output:** Hashtags trending, vídeos trending com métricas
- **Método:** TikTok Creative Center API (ads.tiktok.com)
- **MVP:** SIM

### 4.7 Sound Scraper
- **Input:** URL do som ou busca por nome
- **Output:** Nome, artista, álbum, duração, vídeos que usam o som
- **Método:** Camada 1 (dados embedados) + Creative Center API
- **MVP:** SIM

### 4.8 Engagement Calculator (Processor)
- **Input:** Dados de perfil + vídeos
- **Output:** Taxa de engajamento, média de views/likes/comments, growth rate
- **Método:** Cálculo sobre dados já extraídos
- **MVP:** SIM (diferencial competitivo)

---

## 5. Schema de Output

### 5.1 ProfileOutput

```typescript
interface ProfileOutput {
  userId: string;
  secUid: string;
  username: string;
  nickname: string;
  bio: string;
  avatarUrl: string;
  isVerified: boolean;
  isPrivate: boolean;
  followerCount: number;
  followingCount: number;
  heartCount: number;
  videoCount: number;
  bioLink?: string;
  region: string;
  engagement: {
    avgViews: number;
    avgLikes: number;
    avgComments: number;
    avgShares: number;
    engagementRate: number; // (likes+comments+shares) / views * 100
  };
  recentVideos?: VideoOutput[];
  scrapedAt: string;
}
```

### 5.2 VideoOutput

```typescript
interface VideoOutput {
  videoId: string;
  url: string;
  description: string;
  createTime: number;
  createTimeISO: string;
  duration: number;
  coverUrl: string;
  playUrl?: string;
  stats: {
    playCount: number;
    likeCount: number;
    commentCount: number;
    shareCount: number;
    collectCount: number;
  };
  hashtags: string[];
  author: {
    userId: string;
    username: string;
    nickname: string;
    avatarUrl: string;
    isVerified: boolean;
  };
  music: {
    musicId: string;
    title: string;
    authorName: string;
    albumName: string;
    isOriginal: boolean;
    duration: number;
    coverUrl: string;
  };
  isAd: boolean;
  locationCreated?: string;
  scrapedAt: string;
}
```

### 5.3 CommentOutput

```typescript
interface CommentOutput {
  commentId: string;
  text: string;
  author: {
    userId: string;
    username: string;
    nickname: string;
    avatarUrl: string;
  };
  likeCount: number;
  replyCount: number;
  createTime: number;
  createTimeISO: string;
  isAuthorLiked: boolean;
  scrapedAt: string;
}
```

### 5.4 HashtagOutput

```typescript
interface HashtagOutput {
  hashtagId: string;
  name: string;
  viewCount: number;
  videoCount: number;
  description: string;
  coverUrl: string;
  videos: VideoOutput[];
  scrapedAt: string;
}
```

### 5.5 TrendingOutput

```typescript
interface TrendingOutput {
  region: string;
  category: string;
  items: Array<{
    rank: number;
    rankChange: number;
    hashtag: string;
    viewCount: number;
    postCount: number;
    isNew: boolean;
    trendChart: number[]; // 7 dias de dados
  }>;
  scrapedAt: string;
}
```

### 5.6 SoundOutput

```typescript
interface SoundOutput {
  musicId: string;
  title: string;
  authorName: string;
  albumName: string;
  duration: number;
  isOriginal: boolean;
  coverUrl: string;
  playUrl: string;
  videoCount: number;
  videos?: VideoOutput[];
  scrapedAt: string;
}
```

---

## 6. Roadmap

### Fase 1 — MVP Completo (Apify Store)

**Objetivo:** Lançar no Apify Store com todos os 7 módulos
**Prazo estimado:** 3-4 semanas
**Plataforma:** Apify Store (Pay per Event)

| Sprint | Entregas | Duração |
|--------|----------|---------|
| Sprint 1 | Setup + TikTok Web Client + Hydration Extractor + Video Scraper + Profile Scraper | 1 semana |
| Sprint 2 | TikTok API Client + Hashtag Scraper + Search Scraper + Comment Scraper | 1 semana |
| Sprint 3 | Trending Scraper + Sound Scraper + Engagement Calculator | 1 semana |
| Sprint 4 | Testes + Polish + Deploy Apify Store + README | 3-5 dias |

### Fase 2 — API Própria (Contabo) — Futura

Quando o produto gerar receita no Apify, migrar core para API REST na Contabo com planos em R$.

---

## 7. Requisitos Não-Funcionais

| Requisito | Meta |
|-----------|------|
| Taxa de sucesso | > 90% (TikTok é mais instável que YouTube) |
| Tempo médio por vídeo | < 5 segundos |
| Retry automático | Sim, com backoff exponencial |
| Fallback browser | Sim, PlaywrightCrawler quando HTTP falha |
| Proxy | Residencial via Apify (incluso) |
| Manutenção | Monitorar mudanças de API a cada 2-4 semanas |

---

## 8. Riscos e Mitigações

| Risco | Probabilidade | Mitigação |
|-------|---------------|-----------|
| TikTok muda APIs internas (a cada 4-8 semanas) | Alta | Monitoramento, testes automatizados, 3 camadas de fallback |
| Bloqueio por anti-bot | Alta | Proxies residenciais (Apify), got-scraping com fingerprint TLS |
| Dados embedados mudam de estrutura | Média | Hydration extractor com detecção de schema, testes contra fixtures |
| Concorrente clockworks baixa preços | Baixa | Diferencial em features (unificado, engagement, trending BR) |
| TikTok Shop muda dados de música (disputa UMG) | Média | Fallback graceful, campos opcionais |

---

## 9. Métricas de Sucesso

| Métrica | Meta 30 dias | Meta 90 dias | Meta 6 meses |
|---------|-------------|-------------|--------------|
| Usuários Apify Store | 100 | 500 | 1.500+ |
| Reviews (média) | 4.5+ | 4.5+ | 4.5+ |
| Taxa de sucesso | > 90% | > 93% | > 95% |
| Receita Apify | $100/mês | $500/mês | $1.500+/mês |
