import { cnTodayKey } from "@/utils/timeCn";

export type MoodId = "happy" | "calm" | "tired" | "sad" | "angry" | "hope";

export type MoodFaceStyle = "emoji" | "sticker";

const FACE_STYLE_KEY = "jiuban-mood-face-style";

const MOOD_ID_SET = new Set<string>(["happy", "calm", "tired", "sad", "angry", "hope"]);

/** Accept only known mood ids from API / storage. */
export function parseMoodId(raw: string | null | undefined): MoodId | null {
  const m = (raw || "").trim().toLowerCase();
  return MOOD_ID_SET.has(m) ? (m as MoodId) : null;
}

export interface MoodOption {
  id: MoodId;
  label: string;
  /** Kid-facing face; decorative, label remains accessible text. */
  emoji: string;
  tint: string;
}

export const MOOD_OPTIONS: MoodOption[] = [
  { id: "happy", label: "开心", emoji: "😊", tint: "#ffe8a3" },
  { id: "calm", label: "平静", emoji: "😌", tint: "#d8f3ee" },
  { id: "tired", label: "有点累", emoji: "😮‍💨", tint: "#e8e4f5" },
  { id: "sad", label: "难过", emoji: "😢", tint: "#dce9f8" },
  { id: "angry", label: "生气", emoji: "😤", tint: "#ffd4c8" },
  { id: "hope", label: "期待", emoji: "🤩", tint: "#ffe0f0" },
];

/** Short daily lines — bookmark ribbon copy, rotates by calendar day. */
const DAILY_QUOTES = [
  "今天也是可以被温柔对待的一天。",
  "心情像天气，阴天也有彩虹。",
  "慢慢来，伙伴一直在。",
  "说出来的心事，会轻一点。",
  "小太阳也会打瞌睡，没关系。",
  "你已经很努力啦，歇口气也好。",
  "把开心存进小口袋，随时拿出来用。",
  "难过可以靠一靠，不用自己扛。",
  "今天的你，也值得被抱抱。",
  "生气时先喝口水，再慢慢说。",
  "世界很大，你的感受很重要。",
  "和好朋友聊天，心情会发光。",
  "期待明天，也好好过今天。",
];

/** Re-export: calendar day lives in utils/timeCn (not UI constants). */
export { cnTodayKey };

export function dailyMoodQuote(dayKey?: string): string {
  const key = dayKey && /^\d{4}-\d{2}-\d{2}$/.test(dayKey) ? dayKey : cnTodayKey();
  const [y, m, d] = key.split("-").map(Number);
  const n = y * 372 + m * 31 + d;
  return DAILY_QUOTES[((n % DAILY_QUOTES.length) + DAILY_QUOTES.length) % DAILY_QUOTES.length];
}

export function moodOption(id: MoodId | null | undefined): MoodOption | undefined {
  if (!id) return undefined;
  return MOOD_OPTIONS.find((o) => o.id === id);
}

export function getMoodFaceStyle(): MoodFaceStyle {
  try {
    const v = localStorage.getItem(FACE_STYLE_KEY);
    if (v === "sticker" || v === "emoji") return v;
  } catch {
    /* private mode */
  }
  return "emoji";
}

export function setMoodFaceStyle(style: MoodFaceStyle) {
  try {
    localStorage.setItem(FACE_STYLE_KEY, style);
  } catch {
    /* ignore */
  }
}
