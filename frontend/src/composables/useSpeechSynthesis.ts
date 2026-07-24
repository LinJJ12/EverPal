import { ref } from "vue";
import { speechSynthesisSupported } from "@/utils/speech";

export function useSpeechSynthesis() {
  const supported = speechSynthesisSupported();
  const speaking = ref(false);
  const error = ref("");

  function clearError() {
    error.value = "";
  }

  function stop() {
    if (!supported) return;
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
    stop();
    const u = new SpeechSynthesisUtterance(t);
    u.lang = "zh-CN";
    u.onend = () => {
      speaking.value = false;
    };
    u.onerror = () => {
      speaking.value = false;
      error.value = "现在读不了，稍后再试";
    };
    speaking.value = true;
    try {
      window.speechSynthesis.speak(u);
    } catch {
      speaking.value = false;
      error.value = "现在读不了，稍后再试";
    }
  }

  return { supported, speaking, error, clearError, speak, stop };
}
