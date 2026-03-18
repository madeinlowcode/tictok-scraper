import { gotScraping } from 'got-scraping';
import type { InputType } from '../types/index.js';

const VIDEO_URL_PATTERN = /\/@[\w.]+\/video\/(\d+)/;
const SHORT_URL_PATTERN = /^https?:\/\/vm\.tiktok\.com\//;
const USERNAME_PATTERN = /\/@([\w.]+)/;
const HASHTAG_URL_PATTERN = /\/tag\/([\w]+)/;
const MUSIC_URL_PATTERN = /\/music\//;

export function extractVideoId(url: string): string | null {
  const match = url.match(VIDEO_URL_PATTERN);
  return match?.[1] ?? null;
}

export function extractUsername(url: string): string | null {
  // Handle bare @username input
  if (url.startsWith('@')) {
    return url.slice(1).split(/[?#/]/)[0] ?? null;
  }
  const match = url.match(USERNAME_PATTERN);
  return match?.[1] ?? null;
}

export function extractHashtag(url: string): string | null {
  const match = url.match(HASHTAG_URL_PATTERN);
  return match?.[1] ?? null;
}

export async function resolveShortUrl(shortUrl: string): Promise<string> {
  const response = await gotScraping({
    url: shortUrl,
    followRedirect: false,
    throwHttpErrors: false,
  });

  const location = response.headers.location;
  if (location && typeof location === 'string') {
    return location;
  }

  return shortUrl;
}

export function isShortUrl(url: string): boolean {
  return SHORT_URL_PATTERN.test(url);
}

export function detectInputType(input: string): InputType {
  // URL-based detection
  if (input.includes('tiktok.com') || input.startsWith('http')) {
    if (VIDEO_URL_PATTERN.test(input)) return 'video';
    if (MUSIC_URL_PATTERN.test(input)) return 'sound';
    if (HASHTAG_URL_PATTERN.test(input)) return 'hashtag';
    if (USERNAME_PATTERN.test(input)) return 'profile';
    if (isShortUrl(input)) return 'video'; // Short URLs are usually videos
  }

  // Bare @username
  if (input.startsWith('@')) return 'profile';

  // Bare #hashtag
  if (input.startsWith('#')) return 'hashtag';

  // Default: treat as keyword search
  return 'keyword';
}
