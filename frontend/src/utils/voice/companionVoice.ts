import { speechSynthesisSupported } from "@/utils/voice/browser";

export type CompanionVoiceProfile = {
  rate: number;
  pitch: number;
  /** Prefer female / male / any among zh voices */
  prefer: "female" | "male" | "any";
};

/** Browser TTS fallback — differentiate via rate/pitch + system voice pick. */
export const COMPANION_VOICE: Record<string, CompanionVoiceProfile> = {
  nuan: { rate: 0.92, pitch: 1.12, prefer: "female" },
  tiao: { rate: 1.12, pitch: 1.28, prefer: "female" },
  cha: { rate: 0.88, pitch: 0.85, prefer: "male" },
};

const COMPANION_VOICE_ORDER = ["nuan", "tiao", "cha"] as const;

export function voiceProfileFor(companionId: string | null | undefined): CompanionVoiceProfile {
  const id = companionId || "nuan";
  return COMPANION_VOICE[id] || COMPANION_VOICE.nuan;
}

export function clampRate(rate: number): number {
  return Math.min(2, Math.max(0.5, rate));
}

export function clampPitch(pitch: number): number {
  return Math.min(2, Math.max(0, pitch));
}

function isZhVoice(v: SpeechSynthesisVoice): boolean {
  const lang = (v.lang || "").toLowerCase();
  return lang.startsWith("zh") || lang.includes("cmn") || /chinese|中文|普通话|国语/i.test(v.name);
}

function genderScore(v: SpeechSynthesisVoice, prefer: CompanionVoiceProfile["prefer"]): number {
  if (prefer === "any") return 0;
  const name = v.name.toLowerCase();
  const female =
    /female|woman|girl|女|婷|晓|佳|美|慧|yan|hui|xiaoxiao|xiaoyi|zira|samantha|tingting|xiaoxuan/i.test(
      name,
    );
  const male =
    /male|man|boy|男|强|伟|军|kangkang|yunyang|yunjian|david|mark|daniel|yaoyao/i.test(name);
  if (prefer === "female") return female ? 2 : male ? -1 : 0;
  return male ? 2 : female ? -1 : 0;
}

function companionIndex(companionId: string | null | undefined): number {
  const raw = companionId || "nuan";
  const idx = COMPANION_VOICE_ORDER.indexOf(raw as (typeof COMPANION_VOICE_ORDER)[number]);
  return idx >= 0 ? idx : 0;
}

/**
 * Pick a zh system voice for this companion (browser fallback only).
 */
export function pickCompanionVoice(
  companionId: string | null | undefined,
  voices: SpeechSynthesisVoice[],
): SpeechSynthesisVoice | undefined {
  const profile = voiceProfileFor(companionId);
  const zh = voices.filter(isZhVoice);
  const pool = zh.length ? zh : voices;
  if (!pool.length) return undefined;

  const scored = pool
    .map((v) => ({ v, s: genderScore(v, profile.prefer) }))
    .sort((a, b) => b.s - a.s || a.v.name.localeCompare(b.v.name, "zh"));

  const preferred = scored.filter((x) => x.s > 0).map((x) => x.v);
  const list = preferred.length ? preferred : scored.map((x) => x.v);
  return list[companionIndex(companionId) % list.length];
}

export function speechVoicesReady(): boolean {
  return speechSynthesisSupported() && window.speechSynthesis.getVoices().length > 0;
}
