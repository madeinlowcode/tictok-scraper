import { RETRY_CONFIG } from '../config/constants.js';
import { RateLimitError, TikTokError } from '../types/index.js';

interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

interface HttpError extends Error {
  statusCode?: number;
  response?: { statusCode: number };
}

function getStatusCode(error: unknown): number | undefined {
  const err = error as HttpError;
  return err.statusCode ?? err.response?.statusCode;
}

function isRetryable(error: unknown): boolean {
  const statusCode = getStatusCode(error);
  if (!statusCode) return true; // Network errors are retryable

  if (RETRY_CONFIG.nonRetryableStatusCodes.includes(statusCode as 400 | 401 | 403 | 404)) {
    return false;
  }

  return RETRY_CONFIG.retryableStatusCodes.includes(statusCode as 429 | 500 | 502 | 503 | 504);
}

function calculateDelay(attempt: number, baseDelayMs: number, maxDelayMs: number): number {
  const delay = baseDelayMs * Math.pow(2, attempt);
  const jitter = delay * 0.1 * Math.random();
  return Math.min(delay + jitter, maxDelayMs);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const maxRetries = options.maxRetries ?? RETRY_CONFIG.maxRetries;
  const baseDelayMs = options.baseDelayMs ?? RETRY_CONFIG.baseDelayMs;
  const maxDelayMs = options.maxDelayMs ?? RETRY_CONFIG.maxDelayMs;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (!isRetryable(error)) {
        throw error;
      }

      const statusCode = getStatusCode(error);
      if (statusCode === 429) {
        throw new RateLimitError('Rate limit exceeded');
      }

      if (attempt < maxRetries) {
        const delay = calculateDelay(attempt, baseDelayMs, maxDelayMs);
        await sleep(delay);
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new TikTokError(`Request failed after ${maxRetries} retries`);
}
