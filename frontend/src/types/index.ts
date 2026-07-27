export type Mode = "child";

export interface Companion {
  id: string;
  name: string;
  role: string;
  blurb: string;
}

/** Encyclopedia citation from SSE `done.sources` (zhwiki). */
export interface ChatSource {
  title: string;
  url: string;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  sources?: ChatSource[];
}

export type MemoryCategory = "like" | "dislike" | "event" | "preference";

export interface MemoryItem {
  id?: number;
  text: string;
  category?: MemoryCategory;
  created_at?: number;
}

export interface Profile {
  client_id: string;
  nickname: string;
  mode: Mode;
  companion_id: string;
  likes: string[];
  memories: MemoryItem[];
}

export interface SessionSummary {
  id: string;
  client_id: string;
  title: string;
  companion_id: string;
  mode: string;
  updated_at: number;
  messages?: ChatMessage[];
}

export const LIKE_OPTIONS = [
  { id: "dinosaurs", label: "恐龙" },
  { id: "drawing", label: "画画" },
  { id: "soccer", label: "足球" },
  { id: "cats", label: "小猫" },
  { id: "music", label: "音乐" },
  { id: "reading", label: "看书" },
  { id: "space", label: "宇宙" },
  { id: "games", label: "小游戏" },
] as const;
