/** Minimal Web Speech typings (Chromium `webkitSpeechRecognition`). */

export interface JiubanSpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly 0: { transcript: string };
  readonly length: number;
}

export interface JiubanSpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: ArrayLike<JiubanSpeechRecognitionResult>;
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
