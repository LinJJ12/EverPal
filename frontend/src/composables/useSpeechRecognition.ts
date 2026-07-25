import { ref } from "vue";
import {
  getSpeechRecognitionCtor,
  sanitizeSpeechTranscript,
  speechRecognitionSupported,
  transcriptFromResult,
  type JiubanSpeechRecognition,
} from "@/utils/voice/browser";

function mapRecognitionError(code: string): string {
  if (code === "not-allowed" || code === "service-not-allowed") {
    return "需要麦克风权限才能说话哦";
  }
  if (code === "no-speech") {
    return "没听清，再试一次或打字吧";
  }
  if (code === "network") {
    return "语音识别连不上，稍后再试或打字聊吧";
  }
  if (code === "aborted") {
    return "";
  }
  return "没听清，再试一次或打字吧";
}

export function useSpeechRecognition() {
  const supported = speechRecognitionSupported();
  const listening = ref(false);
  const error = ref("");
  let rec: JiubanSpeechRecognition | null = null;
  let finals = "";
  let endWait: ((text: string) => void) | null = null;
  let stopTimer: number | null = null;

  function clearError() {
    error.value = "";
  }

  function clearStopTimer() {
    if (stopTimer !== null) {
      window.clearTimeout(stopTimer);
      stopTimer = null;
    }
  }

  function finishWait(text: string) {
    clearStopTimer();
    const resolve = endWait;
    endWait = null;
    listening.value = false;
    rec = null;
    resolve?.(sanitizeSpeechTranscript(text));
  }

  function start() {
    error.value = "";
    finals = "";
    clearStopTimer();
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      error.value = "当前浏览器暂不支持语音，请打字聊";
      return;
    }
    try {
      rec?.abort();
    } catch {
      /* ignore */
    }
    rec = new Ctor();
    rec.lang = "zh-CN";
    // Click-to-talk: keep session open until user taps 「说完了」.
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (ev) => {
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const row = ev.results[i] ?? ev.results.item(i);
        if (!row?.isFinal) continue;
        const t = transcriptFromResult(row);
        if (t) finals = finals ? `${finals}${t}` : t;
      }
    };
    rec.onerror = (ev) => {
      const msg = mapRecognitionError(ev.error);
      if (msg) error.value = msg;
    };
    rec.onend = () => {
      finishWait(finals);
    };
    try {
      rec.start();
      listening.value = true;
    } catch {
      listening.value = false;
      rec = null;
      error.value = "没听清，再试一次或打字吧";
    }
  }

  function stop(): Promise<string> {
    if (!rec || !listening.value) {
      return Promise.resolve(sanitizeSpeechTranscript(finals));
    }
    return new Promise((resolve) => {
      endWait = resolve;
      try {
        rec?.stop();
      } catch {
        finishWait(finals);
        return;
      }
      // Some engines never fire onend after stop()
      stopTimer = window.setTimeout(() => {
        if (endWait === resolve) {
          finishWait(finals);
        }
      }, 1500);
    });
  }

  function abort() {
    clearStopTimer();
    const resolve = endWait;
    endWait = null;
    try {
      rec?.abort();
    } catch {
      /* ignore */
    }
    rec = null;
    listening.value = false;
    // Unblock any in-flight stop() promise
    resolve?.("");
  }

  return {
    supported,
    listening,
    error,
    clearError,
    start,
    stop,
    abort,
  };
}
