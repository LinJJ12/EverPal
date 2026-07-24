import { ref } from "vue";
import { speechSynthesisSupported } from "@/utils/speech";

export function useSpeechSynthesis() {
  const supported = speechSynthesisSupported();
  const speaking = ref(false);
  const error = ref("");
  let speakTimer: number | null = null;

  function clearError() {
    error.value = "";
  }

  function clearSpeakTimer() {
    if (speakTimer !== null) {
      window.clearTimeout(speakTimer);
      speakTimer = null;
    }
  }

  function stop() {
    clearSpeakTimer();
    if (!supported) {
      speaking.value = false;
      return;
    }
    window.speechSynthesis.cancel();
    speaking.value = false;
  }

  function speak(text: string) {
    error.value = "";
    const t = text.trim();
    if (!t) return;
    if (!supported) {
      error.value = "当前浏览器暂不支持朗读";
      return;
    }
    // Chrome: cancel() then immediate speak() often no-ops — defer one tick.
    stop();
    const u = new SpeechSynthesisUtterance(t);
    u.lang = "zh-CN";
    u.onend = () => {
      speaking.value = false;
    };
    u.onerror = (ev) => {
      speaking.value = false;
      const code = String((ev as SpeechSynthesisErrorEvent).error || "");
      if (code === "interrupted" || code === "canceled" || code === "cancelled") {
        return;
      }
      error.value = "现在读不了，稍后再试";
    };
    speaking.value = true;
    speakTimer = window.setTimeout(() => {
      speakTimer = null;
      try {
        window.speechSynthesis.speak(u);
      } catch {
        speaking.value = false;
        error.value = "现在读不了，稍后再试";
      }
    }, 0);
  }

  return { supported, speaking, error, clearError, speak, stop };
}
