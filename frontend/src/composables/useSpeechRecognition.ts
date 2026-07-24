import { ref } from "vue";
import {
  getSpeechRecognitionCtor,
  speechRecognitionSupported,
  type JiubanSpeechRecognition,
} from "@/utils/speech";

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

  function clearError() {
    error.value = "";
  }

  function start() {
    error.value = "";
    finals = "";
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
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (ev) => {
      let chunk = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const row = ev.results[i];
        if (row.isFinal) {
          const t = row[0]?.transcript?.trim();
          if (t) finals = finals ? `${finals}${t}` : t;
        } else {
          chunk += row[0]?.transcript || "";
        }
      }
      void chunk;
    };
    rec.onerror = (ev) => {
      const msg = mapRecognitionError(ev.error);
      if (msg) error.value = msg;
    };
    rec.onend = () => {
      listening.value = false;
      const text = finals.trim();
      const resolve = endWait;
      endWait = null;
      rec = null;
      resolve?.(text);
    };
    try {
      rec.start();
      listening.value = true;
    } catch {
      listening.value = false;
      error.value = "没听清，再试一次或打字吧";
    }
  }

  function stop(): Promise<string> {
    if (!rec || !listening.value) {
      return Promise.resolve(finals.trim());
    }
    return new Promise((resolve) => {
      endWait = resolve;
      try {
        rec?.stop();
      } catch {
        listening.value = false;
        endWait = null;
        resolve(finals.trim());
      }
      // Safety: some engines never fire onend
      window.setTimeout(() => {
        if (endWait === resolve) {
          endWait = null;
          listening.value = false;
          resolve(finals.trim());
        }
      }, 1500);
    });
  }

  function abort() {
    endWait = null;
    try {
      rec?.abort();
    } catch {
      /* ignore */
    }
    rec = null;
    listening.value = false;
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
