import { gotScraping } from 'got-scraping';
import {
  TIKTOK_BASE_URL,
  API_BASE_PARAMS,
  API_ENDPOINTS,
  USER_AGENTS,
  PAGINATION_DEFAULTS,
} from '../config/constants.js';
import { withRetry } from '../utils/retry-handler.js';
import { RateLimiter } from '../utils/rate-limiter.js';
import { CookieManager } from '../utils/cookie-manager.js';
import { SignatureGenerator } from '../utils/signature-generator.js';
import type {
  ClientConfig,
  RawVideoListResponse,
  RawCommentListResponse,
  RawSearchResponse,
  RawTrendingResponse,
  RawSoundData,
} from '../types/index.js';

interface ApiResponse<T> {
  data: T;
  requiresBrowserFallback?: boolean;
}

export class TikTokApiClient {
  private readonly proxyUrl?: string;
  private readonly rateLimiter: RateLimiter;
  private readonly cookieManager: CookieManager;
  private readonly signatureGenerator: SignatureGenerator;
  private readonly maxRetries: number;

  constructor(config: ClientConfig = {}, options?: { cookieManager?: CookieManager; signatureGenerator?: SignatureGenerator }) {
    this.proxyUrl = config.proxyUrl;
    this.maxRetries = config.maxRetries ?? 3;
    this.rateLimiter = new RateLimiter();
    this.cookieManager = options?.cookieManager ?? new CookieManager();
    this.signatureGenerator = options?.signatureGenerator ?? new SignatureGenerator({
      cookieProvider: this.cookieManager,
    });
  }

  async getProfileVideos(
    secUid: string,
    cursor?: string,
  ): Promise<RawVideoListResponse & { requiresBrowserFallback?: boolean }> {
    const params: Record<string, string> = {
      ...API_BASE_PARAMS,
      secUid,
      count: String(PAGINATION_DEFAULTS.videosPerPage),
      ...(cursor && { cursor }),
    };

    const result = await this.apiRequest(
      `${TIKTOK_BASE_URL}${API_ENDPOINTS.POST_ITEM_LIST}`,
      params,
    );

    return {
      itemList: (result.data as Record<string, unknown>).itemList as RawVideoListResponse['itemList'] ?? [],
      hasMore: (result.data as Record<string, unknown>).hasMore as boolean ?? false,
      cursor: String((result.data as Record<string, unknown>).cursor ?? '0'),
      requiresBrowserFallback: result.requiresBrowserFallback,
    };
  }

  async getComments(
    videoId: string,
    cursor?: string,
  ): Promise<RawCommentListResponse & { requiresBrowserFallback?: boolean }> {
    const params: Record<string, string> = {
      ...API_BASE_PARAMS,
      aweme_id: videoId,
      count: String(PAGINATION_DEFAULTS.commentsPerPage),
      ...(cursor && { cursor }),
    };

    const result = await this.apiRequest(
      `${TIKTOK_BASE_URL}${API_ENDPOINTS.COMMENT_LIST}`,
      params,
    );

    const data = result.data as Record<string, unknown>;
    return {
      comments: data.comments as RawCommentListResponse['comments'] ?? [],
      has_more: data.has_more as boolean ?? false,
      cursor: data.cursor as number ?? 0,
      total: data.total as number ?? 0,
      requiresBrowserFallback: result.requiresBrowserFallback,
    };
  }

  async search(
    keyword: string,
    offset?: number,
  ): Promise<RawSearchResponse & { requiresBrowserFallback?: boolean }> {
    const params: Record<string, string> = {
      ...API_BASE_PARAMS,
      keyword,
      offset: String(offset ?? 0),
      count: String(PAGINATION_DEFAULTS.searchResultsPerPage),
    };

    const result = await this.apiRequest(
      `${TIKTOK_BASE_URL}${API_ENDPOINTS.SEARCH_GENERAL}`,
      params,
    );

    const data = result.data as Record<string, unknown>;
    return {
      data: data.data as RawSearchResponse['data'] ?? [],
      has_more: data.has_more as boolean ?? false,
      cursor: String(data.cursor ?? '0'),
      requiresBrowserFallback: result.requiresBrowserFallback,
    };
  }

  async getTrendingHashtags(
    region: string = 'BR',
    period: string = '7',
  ): Promise<RawTrendingResponse> {
    const params: Record<string, string> = {
      country_code: region,
      period: period,
      page: '1',
      limit: '50',
    };

    const result = await this.apiRequest(API_ENDPOINTS.TRENDING_HASHTAGS, params);
    return result.data as unknown as RawTrendingResponse;
  }

  async getPopularSounds(region: string = 'BR'): Promise<RawSoundData[]> {
    const params: Record<string, string> = {
      country_code: region,
      page: '1',
      limit: '50',
    };

    const result = await this.apiRequest(API_ENDPOINTS.POPULAR_SOUNDS, params);
    const responseData = result.data as Record<string, unknown>;
    const dataField = responseData.data as Record<string, unknown> | undefined;
    return ((dataField?.list ?? []) as unknown) as RawSoundData[];
  }

  private async apiRequest(
    baseUrl: string,
    params: Record<string, string>,
  ): Promise<ApiResponse<Record<string, unknown>>> {
    await this.rateLimiter.waitForSlot();

    // Get rotated cookies
    const cookies = this.cookieManager.getNextCookieSet();
    const cookieHeader = Object.entries(cookies)
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');

    // Sign the URL
    const { signedUrl, requiresBrowserFallback } =
      await this.signatureGenerator.signUrl(baseUrl, params);

    let fallback = requiresBrowserFallback;

    try {
      const data = await withRetry(
        async () => {
          const response = await gotScraping({
            url: signedUrl,
            headers: {
              'User-Agent':
                USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]!,
              Cookie: cookieHeader,
              Referer: 'https://www.tiktok.com/',
            },
            proxyUrl: this.proxyUrl,
            responseType: 'json',
            throwHttpErrors: true,
          });

          return response.body as Record<string, unknown>;
        },
        { maxRetries: this.maxRetries },
      );

      return { data, requiresBrowserFallback: fallback };
    } catch (error) {
      const statusCode = (error as { statusCode?: number; response?: { statusCode: number } }).statusCode
        ?? (error as { response?: { statusCode: number } }).response?.statusCode;

      if (statusCode === 403) {
        // Invalidate the cookie set that was used
        const usedIndex = (this.cookieManager.getCurrentIndex() - 1 + this.cookieManager.getPoolSize()) % this.cookieManager.getPoolSize();
        await this.cookieManager.invalidateCookieSet(usedIndex);
        fallback = true;

        return {
          data: {} as Record<string, unknown>,
          requiresBrowserFallback: true,
        };
      }

      throw error;
    }
  }
}
