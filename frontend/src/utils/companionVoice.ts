import { speechSynthesisSupported } from "@/utils/speech";

export type CompanionVoiceProfile = {
  rate: number;
  pitch: number;
  /** Prefer female / male / any among zh voices */
  prefer: "female" | "male" | "any";
};

/** Browser TTS cannot ship custom samples — differentiate via rate/pitch + system voice pick. */
export const COMPANION_VOICE: Record<string, CompanionVoiceProfile> = {
  nuan: { rate: 0.92, pitch: 1.12, prefer: "female" }, // 温柔偏慢、略高
  tiao: { rate: 1.12, pitch: 1.28, prefer: "female" }, // 活泼偏快、更高
  cha: { rate: 0.88, pitch: 0.85, prefer: "male" }, // 沉稳偏慢、略低
};

export function voiceProfileFor(companionId: string | null | undefined): CompanionVoiceProfile {
  const id = companionId || "nuan";
  return COMPANION_VOICE[id] || COMPANION_VOICE.nuan;
}

function isZhVoice(v: SpeechSynthesisVoice): boolean {
  const lang = (v.lang || "").toLowerCase();
  return lang.startsWith("zh") || lang.includes("cmn") || /chinese|中文|普通话|国语/i.test(v.name);
}

function genderScore(v: SpeechSynthesisVoice, prefer: CompanionVoiceProfile["prefer"]): number {
  if (prefer === "any") return 0;
  const name = v.name.toLowerCase();
  const female =
    /female|woman|girl|女|婷|晓|佳|美|慧|yan|hui|xiaoxiao|xiaoyi|zira|samantha|ting/i.test(name);
  const male =
    /male|man|boy|男|强|伟|军|kangkang|yunyang|david|mark|daniel/i.test(name);
  if (prefer === "female") return female ? 2 : male ? -1 : 0;
  return male ? 2 : female ? -1 : 0;
}

/** Pick a stable zh voice for this companion; may return undefined. */
export function pickCompanionVoice(
  companionId: string | null | undefined,
  voices: SpeechSynthesisVoice[],
): SpeechSynthesisVoice | undefined {
  const profile = voiceProfileFor(companionId);
  const zh = voices.filter(isZhVoice);
  const pool = zh.length ? zh : voices;
  if (!pool.length) return undefined;

  const ranked = [...pool].sort((a, b) => {
    const g = genderScore(b, profile.prefer) - genderScore(a, profile.prefer);
    if (g !== 0) return g;
    return a.name.localeCompare(b.name);
  });

  // Spread companions across the ranked list when multiple voices exist
  const ids = ["nuan", "tiao", "cha"];
  const raw = companionId || "nuan";
  const idx = Math.max(0, ids.indexOf(raw));
  if (ranked.length >= 3) return ranked[idx % ranked.length];
  if (ranked.length === 2) return ranked[idx % 2];
  return ranked[0];
}

export function speechVoicesReady(): boolean {
  return speechSynthesisSupported() && window.speechSynthesis.getVoices().length > 0;
}
