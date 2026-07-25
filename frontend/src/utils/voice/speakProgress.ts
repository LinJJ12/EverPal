/** Rough Chinese read-aloud pacing when media duration is missing or unreliable. */

/** Browser Web Speech default pacing. */
export const BROWSER_TTS_CHARS_PER_SEC = 4.0;
/** Cloud neural TTS is usually a bit slower than the browser estimate. */
export const CLOUD_TTS_CHARS_PER_SEC = 3.0;

export function estimateSpeakDurationMs(
  text: string,
  rate: number,
  charsPerSec: number = BROWSER_TTS_CHARS_PER_SEC,
): number {
  const r = Number.isFinite(rate) && rate > 0 ? rate : 1;
  const cps = (Number.isFinite(charsPerSec) && charsPerSec > 0 ? charsPerSec : 4) * r;
  return Math.max(900, Math.round((Math.max(1, text.length) / cps) * 1000));
}

/** Clamp a 0..1 playback ratio. */
export function clampSpeakRatio(ratio: number): number {
  if (!Number.isFinite(ratio)) return 0;
  return Math.min(1, Math.max(0, ratio));
}

/** Map ratio onto display text length (handles trim/truncation mismatches). */
export function charIndexFromRatio(ratio: number, length: number): number {
  if (length <= 0) return 0;
  return Math.min(length, Math.floor(clampSpeakRatio(ratio) * length));
}
