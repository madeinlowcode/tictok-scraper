import type { RawSoundData, SoundOutput } from '../types/index.js';

export function parseSound(raw: RawSoundData): SoundOutput {
  const music = raw.musicInfo?.music;
  const stats = raw.musicInfo?.stats;

  return {
    musicId: music?.id ?? '',
    title: music?.title ?? '',
    authorName: music?.authorName ?? '',
    albumName: music?.album ?? '',
    duration: music?.duration ?? 0,
    isOriginal: music?.original ?? false,
    coverUrl: music?.coverLarge ?? '',
    playUrl: music?.playUrl ?? '',
    videoCount: stats?.videoCount ?? 0,
    scrapedAt: new Date().toISOString(),
  };
}
