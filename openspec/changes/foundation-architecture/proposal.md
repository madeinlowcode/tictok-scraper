## Why

O projeto TikTok Scraper Pro possui documentação completa (PRD, Arquitetura, Sprint Plan) mas **zero código implementado** — nenhum package.json, tsconfig.json, ou arquivo TypeScript existe. Precisamos estabelecer a fundação arquitetural completa: configuração do projeto, sistema de tipos, infraestrutura core (extractor, clients, utils), e o primeiro módulo funcional (Video Scraper) como prova de conceito da arquitetura em 3 camadas.

## What Changes

- **Setup do projeto Node.js/TypeScript** — package.json com todas as dependências, tsconfig.json strict, scripts de build/test/start
- **Sistema de tipos completo** — todas as interfaces de input/output e tipos internos em `src/types/index.ts`
- **Configurações e constantes** — headers HTTP, parâmetros de API, URLs base, configs de retry/rate-limit em `src/config/constants.ts`
- **Hydration Extractor** — componente central que extrai JSON embedado do HTML do TikTok (`__UNIVERSAL_DATA_FOR_REHYDRATION__`)
- **TikTok Web Client** — client HTTP para Camada 1 (dados embedados) usando got-scraping
- **TikTok API Client** — client HTTP para Camada 2 (APIs internas) com paginação via cursor
- **Utils core** — retry handler com backoff exponencial, rate limiter, URL resolver, cookie manager
- **Processors** — engagement calculator e data cleaner
- **Parsers** — todos os 6 parsers (profile, video, comment, hashtag, search, sound) como funções puras
- **Scrapers** — todos os 7 scrapers orquestrando clients + parsers + processors
- **Actor wrapper (main.ts)** — entry point Apify com roteamento, proxy, e Pay per Event
- **Configuração Apify** — .actor/actor.json, input_schema.json, Dockerfile
- **Testes unitários** — cobertura de parsers, extractors, processors e utils com Vitest

## Capabilities

### New Capabilities
- `project-setup`: Configuração inicial do projeto (package.json, tsconfig.json, scripts, estrutura de pastas)
- `type-system`: Sistema completo de tipos TypeScript para inputs, outputs e dados internos
- `hydration-extraction`: Extração de dados embedados do HTML TikTok (Camada 1)
- `http-clients`: Clients HTTP para web scraping (Camada 1) e APIs internas (Camada 2)
- `data-parsing`: Parsers puros para transformar dados brutos em outputs estruturados (6 parsers)
- `scraper-modules`: 7 módulos scrapers (Profile, Video, Comment, Hashtag, Search, Trending, Sound)
- `data-processing`: Engagement calculator e data cleaner para métricas derivadas
- `core-utils`: Utilitários compartilhados (retry, rate-limit, URL resolver, cookie manager)
- `actor-integration`: Wrapper Apify com roteamento, proxy config e Pay per Event
- `test-infrastructure`: Configuração Vitest com fixtures e testes unitários

### Modified Capabilities
_(nenhuma — projeto novo, sem specs existentes)_

## Impact

- **Código:** Criação de ~25+ arquivos TypeScript em `src/` cobrindo toda a arquitetura planejada
- **Dependências:** apify, crawlee, got-scraping, cheerio, playwright (runtime) + typescript, vitest, @types/node (dev)
- **Infraestrutura:** Dockerfile e configuração .actor/ para deploy no Apify Store
- **Testes:** Suíte Vitest com fixtures de dados reais do TikTok
- **Build:** Pipeline TypeScript → JavaScript com scripts npm padronizados
