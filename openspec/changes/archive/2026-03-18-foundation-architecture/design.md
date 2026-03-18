## Context

O TikTok Scraper Pro é um Actor Apify que unifica 7 módulos de scraping em um único produto. A documentação (PRD, Arquitetura, Sprint Plan) está 100% completa, mas nenhum código existe. Este design cobre a implementação completa da fundação — do `package.json` até o Actor deployável.

**Constraints:**
- Core (`clients/`, `parsers/`, `extractors/`, `processors/`, `utils/`) NÃO importa Apify SDK
- Apenas `main.ts` usa Apify SDK
- TypeScript strict mode — interfaces para tudo, sem `any`
- Funções puras nos parsers — sem side effects
- Retry com backoff exponencial em toda chamada HTTP
- Region default: BR

## Goals / Non-Goals

**Goals:**
- Implementar a arquitetura completa em 3 camadas (embedado → API → browser fallback)
- Criar todos os 7 módulos scrapers funcionais
- Manter core 100% independente do Apify SDK para futura migração
- Ter testes unitários cobrindo parsers, extractors e processors
- Actor funcional no Apify Store com Pay per Event

**Non-Goals:**
- Otimização avançada de performance (prematura nesta fase)
- Suporte a download de vídeos (apenas metadados)
- Dashboard ou UI própria
- API REST própria (Fase 2 futura)
- Testes end-to-end contra TikTok real (apenas unit tests com fixtures)

## Decisions

### 1. Arquitetura em camadas com separação Core/Wrapper

**Decisão:** Separar o código em Core (independente) e Wrapper (Apify-specific).

**Alternativas:**
- A) Tudo acoplado ao Apify SDK — mais simples, mas impossível migrar
- B) Core independente + Wrapper fino — **escolhido** — permite reusar core em API própria (Fase 2)

**Rationale:** O roadmap prevê migração para infra Contabo. Manter core desacoplado é investimento que paga já na testabilidade (tests não precisam do Apify runtime).

### 2. Hydration Data como fonte primária (Camada 1)

**Decisão:** Priorizar extração de dados do `<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__">` em vez de APIs internas.

**Alternativas:**
- A) APIs internas primeiro — mais dados, mas instáveis (mudam a cada 4-8 semanas)
- B) Hydration data primeiro — **escolhido** — mais estável, mais rápido, sem necessidade de tokens
- C) Browser first — mais completo, mas 10x mais lento e caro

**Rationale:** Dados embedados são servidos no HTML inicial sem autenticação extra. APIs internas exigem msToken, X-Bogus, _signature que podem quebrar.

### 3. got-scraping como HTTP client

**Decisão:** Usar `got-scraping` (via Crawlee) para todas as chamadas HTTP.

**Alternativas:**
- A) axios/fetch — sem fingerprint TLS, bloqueado facilmente
- B) got-scraping — **escolhido** — fingerprint TLS integrado, compatível com Crawlee
- C) Playwright para tudo — funciona mas é 10x mais lento/caro

**Rationale:** got-scraping já faz TLS fingerprinting realista. Playwright fica como fallback (Camada 3).

### 4. Cheerio para parsing HTML

**Decisão:** Usar cheerio para extrair o script tag de hydration.

**Alternativas:**
- A) Regex — frágil, difícil de manter
- B) cheerio — **escolhido** — API jQuery-like, leve, confiável para extrair tags específicas
- C) jsdom — completo demais, overhead desnecessário

### 5. Vitest para testes

**Decisão:** Vitest com fixtures de dados reais.

**Alternativas:**
- A) Jest — mais popular, mas mais lento com TypeScript
- B) Vitest — **escolhido** — TypeScript nativo, rápido, API compatível com Jest

### 6. Estrutura de paginação cursor-based

**Decisão:** Implementar paginação genérica baseada em cursor + hasMore para todas as APIs internas.

**Rationale:** TikTok usa cursor numérico (diferente de YouTube que usa continuationToken). Um padrão unificado de paginação simplifica todos os scrapers que paginem.

### 7. Error types customizados

**Decisão:** Criar hierarquia de erros: `TikTokError` (base) → `ProfileNotFoundError`, `VideoNotFoundError`, `RateLimitError`, `HydrationExtractionError`.

**Rationale:** Permite ao Actor wrapper reagir diferente a cada tipo de erro (retry vs skip vs abort) e dar mensagens claras ao usuário.

## Risks / Trade-offs

- **[APIs internas mudam frequentemente]** → Camada 1 (hydration) como fonte primária; testes com fixtures detectam quebras cedo; Camada 3 (browser) como último recurso
- **[TikTok bloqueia scraping]** → got-scraping com TLS fingerprinting; proxies residenciais via Apify; rate limiting interno; cookie rotation
- **[Hydration data pode mudar de estrutura]** → Extractor com validação de schema; fallback paths; erros descritivos quando estrutura não bate
- **[msToken/X-Bogus necessários para APIs]** → Começar sem signatures; se necessário, usar PlaywrightCrawler para gerar tokens naturalmente
- **[Fixtures podem ficar desatualizadas]** → Documentar como atualizar fixtures; CI semanal com smoke test real (futuro)
- **[Core grande demais para primeira entrega]** → Trade-off aceito: MVP exige todos os 7 módulos (diferencial competitivo é ser unificado)
