export const TIKTOK_BASE_URL = 'https://www.tiktok.com';

export const WEB_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
  'Accept-Encoding': 'gzip, deflate, br',
  Referer: 'https://www.tiktok.com/',
  'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
};

export const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
];

export const API_BASE_PARAMS: Record<string, string> = {
  aid: '1988',
  app_language: 'pt-BR',
  app_name: 'tiktok_web',
  browser_language: 'pt-BR',
  browser_name: 'Mozilla',
  browser_platform: 'Win32',
  channel: 'tiktok_web',
  device_platform: 'web_pc',
  region: 'BR',
};

export const CREATIVE_CENTER_BASE =
  'https://ads.tiktok.com/creative_radar_api/v1/popular_trend';

export const API_ENDPOINTS = {
  POST_ITEM_LIST: '/api/post/item_list/',
  COMMENT_LIST: '/api/comment/list/',
  SEARCH_GENERAL: '/api/search/general/full/',
  TRENDING_HASHTAGS: `${CREATIVE_CENTER_BASE}/hashtag/list`,
  POPULAR_SOUNDS: `${CREATIVE_CENTER_BASE}/sound/list`,
} as const;

export const SUPPORTED_REGIONS = [
  'BR', 'US', 'GB', 'DE', 'FR', 'ES', 'IT', 'JP', 'KR', 'IN',
  'MX', 'AR', 'CO', 'CL', 'PE', 'PT', 'CA', 'AU', 'NL', 'PL',
  'RU', 'TR', 'SA', 'AE', 'EG', 'NG', 'ZA', 'TH', 'VN', 'ID',
  'MY', 'PH', 'SG', 'TW', 'HK',
] as const;

export const SUPPORTED_CATEGORIES = [
  'Education', 'Fashion', 'Beauty', 'Tech', 'Food', 'Sports',
  'Entertainment', 'Gaming', 'Music', 'Travel', 'Fitness',
  'Comedy', 'Dance', 'DIY', 'Pets',
] as const;

export const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  retryableStatusCodes: [429, 500, 502, 503, 504],
  nonRetryableStatusCodes: [400, 401, 403, 404],
} as const;

export const RATE_LIMIT_CONFIG = {
  maxRequestsPerWindow: 30,
  windowMs: 60_000,
} as const;

export const PAGINATION_DEFAULTS = {
  videosPerPage: 30,
  commentsPerPage: 50,
  searchResultsPerPage: 20,
} as const;

export const HYDRATION_SCRIPT_ID = '__UNIVERSAL_DATA_FOR_REHYDRATION__';

export const HYDRATION_PATHS = {
  VIDEO: 'webapp.video-detail',
  PROFILE: 'webapp.user-detail',
  HASHTAG: 'webapp.hashtag-detail',
} as const;

export const DEFAULT_REGION = 'BR';
