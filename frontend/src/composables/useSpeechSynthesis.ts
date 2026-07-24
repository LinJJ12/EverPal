import { ref } from "vue";
import { speechSynthesisSupported } from "@/utils/speech";
import { pickCompanionVoice, voiceProfileFor } from "@/utils/companionVoice";

export function useSpeechSynthesis() {
  const supported = speechSynthesisSupported();
  const speaking = ref(false);
  const error = ref("");
  let speakTimer: number | null = null;
  let voicesLoaded = false;

  function clearError() {
    error.value = "";
  }

  function clearSpeakTimer() {
    if (speakTimer !== null) {
      window.clearTimeout(speakTimer);
      speakTimer = null;
    }
  }

  function ensureVoices(): SpeechSynthesisVoice[] {
    if (!supported) return [];
    let list = window.speechSynthesis.getVoices();
    if (!list.length && !voicesLoaded) {
      // Chrome loads voices async
      window.speechSynthesis.onvoiceschanged = () => {
        voicesLoaded = true;
      };
      list = window.speechSynthesis.getVoices();
    }
    return list;
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

  function speak(text: string, companionId?: string | null) {
    error.value = "";
    const t = text.trim();
    if (!t) return;
    if (!supported) {
      error.value = "当前浏览器暂不支持朗读";
      return;
    }
    // Chrome: cancel() then immediate speak() often no-ops — defer one tick.
    stop();
    const profile = voiceProfileFor(companionId);
    const u = new SpeechSynthesisUtterance(t);
    u.lang = "zh-CN";
    u.rate = profile.rate;
    u.pitch = profile.pitch;
    const voice = pickCompanionVoice(companionId, ensureVoices());
    if (voice) {
      u.voice = voice;
      if (voice.lang) u.lang = voice.lang;
    }
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
        // Re-pick if voices arrived after first call
        if (!u.voice) {
          const late = pickCompanionVoice(companionId, ensureVoices());
          if (late) {
            u.voice = late;
            if (late.lang) u.lang = late.lang;
          }
        }
        window.speechSynthesis.speak(u);
      } catch {
        speaking.value = false;
        error.value = "现在读不了，稍后再试";
      }
    }, 0);
  }

  return { supported, speaking, error, clearError, speak, stop };
}
