/** Minimal Web Speech typings (Chromium `webkitSpeechRecognition`). */

export const SPEECH_TRANSCRIPT_MAX_CHARS = 500;
/** Cap browser TTS payload so huge replies do not freeze the tab. */
export const SPEECH_SPEAK_MAX_CHARS = 2000;

export interface JiubanSpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): { transcript: string };
  [index: number]: { transcript: string };
}

export interface JiubanSpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: {
    readonly length: number;
    item(index: number): JiubanSpeechRecognitionResult;
    [index: number]: JiubanSpeechRecognitionResult;
  };
}

export interface JiubanSpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}

export interface JiubanSpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((ev: JiubanSpeechRecognitionEvent) => void) | null;
  onerror: ((ev: JiubanSpeechRecognitionErrorEvent) => void) | null;
  onend: ((ev: Event) => void) | null;
}

type SpeechRecognitionCtor = new () => JiubanSpeechRecognition;

export function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function speechRecognitionSupported(): boolean {
  return getSpeechRecognitionCtor() !== null;
}

export function speechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Strip controls and cap length before putting STT text into the composer. */
export function sanitizeSpeechTranscript(raw: string): string {
  return raw
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, SPEECH_TRANSCRIPT_MAX_CHARS);
}

export function transcriptFromResult(row: JiubanSpeechRecognitionResult): string {
  const alt = typeof row.item === "function" ? row.item(0) : row[0];
  return alt?.transcript?.trim() || "";
}
