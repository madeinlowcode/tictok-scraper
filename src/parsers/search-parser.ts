import type { RawVideoData, VideoOutput } from '../types/index.js';
import { parseVideo } from './video-parser.js';

export function parseSearchResults(rawItems: RawVideoData[]): VideoOutput[] {
  return rawItems.map(parseVideo);
}
