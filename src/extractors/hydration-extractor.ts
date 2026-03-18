import * as cheerio from 'cheerio';
import { HYDRATION_SCRIPT_ID, HYDRATION_PATHS } from '../config/constants.js';
import { HydrationExtractionError } from '../types/index.js';
import type { RawVideoData, RawProfileData, RawHashtagData } from '../types/index.js';

export function extractHydrationData(html: string): Record<string, unknown> {
  const $ = cheerio.load(html);
  const scriptTag = $(`#${HYDRATION_SCRIPT_ID}`);

  if (scriptTag.length === 0) {
    throw new HydrationExtractionError(
      `Script tag #${HYDRATION_SCRIPT_ID} not found in HTML`,
    );
  }

  const jsonText = scriptTag.html();
  if (!jsonText) {
    throw new HydrationExtractionError('Script tag is empty');
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonText) as Record<string, unknown>;
  } catch {
    throw new HydrationExtractionError('Failed to parse JSON from hydration script');
  }

  const defaultScope = parsed['__DEFAULT_SCOPE__'];
  if (!defaultScope || typeof defaultScope !== 'object') {
    throw new HydrationExtractionError('__DEFAULT_SCOPE__ not found in hydration data');
  }

  return defaultScope as Record<string, unknown>;
}

export function extractVideoFromHydration(data: Record<string, unknown>): RawVideoData {
  const videoDetail = data[HYDRATION_PATHS.VIDEO] as Record<string, unknown> | undefined;
  if (!videoDetail) {
    throw new HydrationExtractionError(
      `Path "${HYDRATION_PATHS.VIDEO}" not found in hydration data`,
    );
  }

  const itemInfo = videoDetail.itemInfo as Record<string, unknown> | undefined;
  if (!itemInfo) {
    throw new HydrationExtractionError('itemInfo not found in video detail');
  }

  const itemStruct = itemInfo.itemStruct;
  if (!itemStruct) {
    throw new HydrationExtractionError('itemStruct not found in video itemInfo');
  }

  return itemStruct as RawVideoData;
}

export function extractProfileFromHydration(data: Record<string, unknown>): RawProfileData {
  const userDetail = data[HYDRATION_PATHS.PROFILE] as Record<string, unknown> | undefined;
  if (!userDetail) {
    throw new HydrationExtractionError(
      `Path "${HYDRATION_PATHS.PROFILE}" not found in hydration data`,
    );
  }

  const userInfo = userDetail.userInfo;
  if (!userInfo) {
    throw new HydrationExtractionError('userInfo not found in profile detail');
  }

  return userInfo as RawProfileData;
}

export function extractHashtagFromHydration(data: Record<string, unknown>): RawHashtagData {
  const hashtagDetail = data[HYDRATION_PATHS.HASHTAG] as Record<string, unknown> | undefined;
  if (!hashtagDetail) {
    throw new HydrationExtractionError(
      `Path "${HYDRATION_PATHS.HASHTAG}" not found in hydration data`,
    );
  }

  return hashtagDetail as unknown as RawHashtagData;
}
