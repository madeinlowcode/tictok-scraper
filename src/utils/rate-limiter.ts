import { RATE_LIMIT_CONFIG } from '../config/constants.js';

interface RateLimiterOptions {
  maxRequests?: number;
  windowMs?: number;
}

export class RateLimiter {
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private timestamps: number[] = [];

  constructor(options: RateLimiterOptions = {}) {
    this.maxRequests = options.maxRequests ?? RATE_LIMIT_CONFIG.maxRequestsPerWindow;
    this.windowMs = options.windowMs ?? RATE_LIMIT_CONFIG.windowMs;
  }

  async waitForSlot(): Promise<void> {
    this.clearExpired();

    if (this.timestamps.length >= this.maxRequests) {
      const oldestTimestamp = this.timestamps[0]!;
      const waitTime = oldestTimestamp + this.windowMs - Date.now();

      if (waitTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        this.clearExpired();
      }
    }

    this.timestamps.push(Date.now());
  }

  private clearExpired(): void {
    const cutoff = Date.now() - this.windowMs;
    this.timestamps = this.timestamps.filter((ts) => ts > cutoff);
  }
}
