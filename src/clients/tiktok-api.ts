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
import type {
  ClientConfig,
  RawVideoListResponse,
  RawCommentListResponse,
  RawSearchResponse,
  RawTrendingResponse,
  RawSoundData,
} from '../types/index.js';

export class TikTokApiClient {
  private readonly proxyUrl?: string;
  private readonly rateLimiter: RateLimiter;
  private readonly cookieManager: CookieManager;
  private readonly maxRetries: number;

  constructor(config: ClientConfig = {}) {
    this.proxyUrl = config.proxyUrl;
    this.maxRetries = config.maxRetries ?? 3;
    this.rateLimiter = new RateLimiter();
    this.cookieManager = new CookieManager();
  }

  async getProfileVideos(
    secUid: string,
    cursor?: string,
  ): Promise<RawVideoListResponse> {
    const params = new URLSearchParams({
      ...API_BASE_PARAMS,
      secUid,
      count: String(PAGINATION_DEFAULTS.videosPerPage),
      ...(cursor && { cursor }),
    });

    const data = await this.apiRequest(
      `${TIKTOK_BASE_URL}${API_ENDPOINTS.POST_ITEM_LIST}`,
      params,
    );

    return {
      itemList: data.itemList ?? [],
      hasMore: data.hasMore ?? false,
      cursor: String(data.cursor ?? '0'),
    } as RawVideoListResponse;
  }

  async getComments(
    videoId: string,
    cursor?: string,
  ): Promise<RawCommentListResponse> {
    const params = new URLSearchParams({
      ...API_BASE_PARAMS,
      aweme_id: videoId,
      count: String(PAGINATION_DEFAULTS.commentsPerPage),
      ...(cursor && { cursor }),
    });

    const data = await this.apiRequest(
      `${TIKTOK_BASE_URL}${API_ENDPOINTS.COMMENT_LIST}`,
      params,
    );

    return {
      comments: data.comments ?? [],
      has_more: data.has_more ?? false,
      cursor: data.cursor ?? 0,
      total: data.total ?? 0,
    } as RawCommentListResponse;
  }

  async search(
    keyword: string,
    offset?: number,
  ): Promise<RawSearchResponse> {
    const params = new URLSearchParams({
      ...API_BASE_PARAMS,
      keyword,
      offset: String(offset ?? 0),
      count: String(PAGINATION_DEFAULTS.searchResultsPerPage),
    });

    const data = await this.apiRequest(
      `${TIKTOK_BASE_URL}${API_ENDPOINTS.SEARCH_GENERAL}`,
      params,
    );

    return {
      data: data.data ?? [],
      has_more: data.has_more ?? false,
      cursor: String(data.cursor ?? '0'),
    } as RawSearchResponse;
  }

  async getTrendingHashtags(
    region: string = 'BR',
    period: string = '7',
  ): Promise<RawTrendingResponse> {
    const params = new URLSearchParams({
      country_code: region,
      period: period,
      page: '1',
      limit: '50',
    });

    const data = await this.apiRequest(API_ENDPOINTS.TRENDING_HASHTAGS, params);

    return data as unknown as RawTrendingResponse;
  }

  async getPopularSounds(region: string = 'BR'): Promise<RawSoundData[]> {
    const params = new URLSearchParams({
      country_code: region,
      page: '1',
      limit: '50',
    });

    const data = await this.apiRequest(API_ENDPOINTS.POPULAR_SOUNDS, params);

    const responseData = data.data as Record<string, unknown> | undefined;
    return ((responseData?.list ?? []) as unknown) as RawSoundData[];
  }

  private async apiRequest(
    baseUrl: string,
    params: URLSearchParams,
  ): Promise<Record<string, unknown>> {
    await this.rateLimiter.waitForSlot();

    const cookieHeader = this.cookieManager.getCookieHeader();

    return withRetry(
      async () => {
        const url = `${baseUrl}?${params.toString()}`;
        const response = await gotScraping({
          url,
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
  }
}
